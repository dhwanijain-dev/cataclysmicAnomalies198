# indexer.py
import sqlite3
import os
import json
import numpy as np
from typing import List, Dict, Any, Optional

# Try to import sentence-transformers; if unavailable, disable embeddings gracefully.
EMBEDDINGS_AVAILABLE = True
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None
    EMBEDDINGS_AVAILABLE = False

# Try to import faiss if available
try:
    import faiss
    FAISS_AVAILABLE = True
except Exception:
    faiss = None
    FAISS_AVAILABLE = False

# Config: embedding dims if model is available. Default to 384 (all-MiniLM-L6-v2).
# If SentenceTransformer is not available, embeddings will be disabled.
EMBED_MODEL_NAME = os.environ.get("EMBED_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
EMBED_DIMS = 384

DB_FILE = os.environ.get("UFDR_DB", "ufdr_data.db")

class Indexer:
    def __init__(self, db_path: str = DB_FILE, model_name: str = EMBED_MODEL_NAME):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._init_db()
        self.model = None
        self.embedding_index = None
        self.ids = []
        self.embeddings_enabled = False

        if EMBEDDINGS_AVAILABLE and SentenceTransformer is not None:
            try:
                # instantiate model lazily; catch failures and disable embeddings if they occur
                self.model = SentenceTransformer(model_name)
                # Attempt to read model dimension from model if possible
                if hasattr(self.model, "get_sentence_embedding_dimension"):
                    EMBED_DIMS_ACTUAL = self.model.get_sentence_embedding_dimension()
                    global EMBED_DIMS
                    EMBED_DIMS = EMBED_DIMS_ACTUAL
                self.embeddings_enabled = True
            except Exception as e:
                print("Warning: SentenceTransformer model initialization failed - embeddings disabled:", e)
                self.model = None
                self.embeddings_enabled = False
        else:
            # embeddings not available in this environment
            self.embeddings_enabled = False

        # load existing embeddings/indices if present
        self._load_embeddings_index_if_exists()

    def _init_db(self):
        cur = self.conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread TEXT,
            sender TEXT,
            receiver TEXT,
            timestamp TEXT,
            text TEXT,
            raw TEXT
        );
        """)
        cur.execute("CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(text, content='messages', content_rowid='id');")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT,
            filename TEXT,
            mtype TEXT,
            timestamp TEXT,
            tags TEXT
        );""")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT
        )""")
        self.conn.commit()

    def add_messages(self, messages: List[Dict[str, Any]]):
        """
        Insert a list of messages into the DB and update FTS index.
        """
        if not messages:
            return
        cur = self.conn.cursor()
        for m in messages:
            cur.execute(
                "INSERT INTO messages (thread,sender,receiver,timestamp,text,raw) VALUES (?,?,?,?,?,?);",
                (m.get("thread"), m.get("sender"), m.get("receiver"), str(m.get("timestamp")), m.get("text"), json.dumps(m.get("raw")))
            )
            rowid = cur.lastrowid
            cur.execute("INSERT INTO messages_fts(rowid, text) VALUES (?, ?);", (rowid, m.get("text") or ""))
        self.conn.commit()

    def add_media(self, media_items: List[Dict[str, Any]]):
        if not media_items:
            return
        cur = self.conn.cursor()
        for m in media_items:
            cur.execute("INSERT INTO media (path,filename,mtype,timestamp,tags) VALUES (?,?,?,?,?);",
                        (m.get("path"), m.get("filename"), m.get("mtype"), m.get("timestamp"), json.dumps(m.get("tags") or [])))
        self.conn.commit()

    def compute_and_store_embeddings(self, limit: Optional[int] = None):
        """
        Compute embeddings for messages and store them as .npy; build FAISS index if available.
        If embeddings are disabled, do nothing.
        """
        if not self.embeddings_enabled or self.model is None:
            print("Embeddings are disabled; skipping compute_and_store_embeddings.")
            return

        cur = self.conn.cursor()
        q = "SELECT id, text FROM messages"
        if limit:
            q += f" LIMIT {limit}"
        rows = cur.execute(q).fetchall()
        texts = [r[1] or "" for r in rows]
        ids = [r[0] for r in rows]
        if not texts:
            return
        # compute embeddings
        embs = self.model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        # persist embeddings and ids
        np.save("embeddings_ids.npy", np.array(ids))
        np.save("embeddings_vectors.npy", embs)
        self.ids = ids
        # build FAISS index if available
        if FAISS_AVAILABLE:
            try:
                index = faiss.IndexFlatIP(embs.shape[1])
                faiss.normalize_L2(embs)
                index.add(embs)
                faiss.write_index(index, "embeddings.faiss")
                self.embedding_index = index
            except Exception as e:
                print("FAISS index build failed, will fallback to numpy-based search:", e)
                self.embedding_index = None
        else:
            # normalize and save normalized vectors for brute-force
            norms = np.linalg.norm(embs, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            embs = embs / norms
            np.save("embeddings_vectors_normalized.npy", embs)
            self.embedding_index = None

    def _load_embeddings_index_if_exists(self):
        """
        Load previous embeddings if present; set up embedding_index if FAISS index exists.
        """
        if os.path.exists("embeddings_ids.npy") and os.path.exists("embeddings_vectors.npy"):
            try:
                self.ids = np.load("embeddings_ids.npy").tolist()
                embs = np.load("embeddings_vectors.npy")
                if FAISS_AVAILABLE and os.path.exists("embeddings.faiss"):
                    self.embedding_index = faiss.read_index("embeddings.faiss")
                else:
                    norms = np.linalg.norm(embs, axis=1, keepdims=True)
                    norms[norms == 0] = 1.0
                    normalized = embs / norms
                    np.save("embeddings_vectors_normalized.npy", normalized)
                    self.embedding_index = None
            except Exception as e:
                print("Failed to load existing embeddings:", e)
                self.embedding_index = None

    def semantic_search(self, query: str, top_k: int = 5):
        """
        Return top_k messages by semantic similarity to query.
        If embeddings are disabled or not present, return [].
        """
        if not self.embeddings_enabled:
            return []
        if self.model is None:
            return []

        try:
            q_emb = self.model.encode([query], convert_to_numpy=True)
            q_emb = q_emb / (np.linalg.norm(q_emb, axis=1, keepdims=True) + 1e-12)
            if FAISS_AVAILABLE and self.embedding_index is not None:
                D, I = self.embedding_index.search(q_emb, top_k)
                results = []
                for idx in I[0]:
                    if idx < len(self.ids):
                        msg_id = int(self.ids[idx])
                        r = self._fetch_message_by_id(msg_id)
                        if r: results.append(r)
                return results
            else:
                if os.path.exists("embeddings_vectors_normalized.npy"):
                    embs = np.load("embeddings_vectors_normalized.npy")
                    sims = (embs @ q_emb.T).squeeze()
                    topk_idx = np.argsort(-sims)[:top_k]
                    results = []
                    for i in topk_idx:
                        msg_id = int(self.ids[i])
                        r = self._fetch_message_by_id(msg_id)
                        if r: results.append(r)
                    return results
        except Exception as e:
            print("semantic_search error:", e)
            return []
        return []

    def _fetch_message_by_id(self, mid: int):
        cur = self.conn.cursor()
        r = cur.execute("SELECT id,thread,sender,receiver,timestamp,text FROM messages WHERE id=?", (mid,)).fetchone()
        if not r:
            return None
        return {"id": r[0], "thread": r[1], "sender": r[2], "receiver": r[3], "timestamp": r[4], "text": r[5]}

    def fts_search(self, phrase: str, limit: int = 50):
        """
        Full-text search via SQLite FTS5.
        """
        cur = self.conn.cursor()
        q = "SELECT messages.id, messages.thread, messages.sender, messages.receiver, messages.timestamp, messages.text FROM messages JOIN messages_fts ON messages_fts.rowid=messages.id WHERE messages_fts MATCH ? LIMIT ?;"
        try:
            rows = cur.execute(q, (phrase, limit)).fetchall()
            return [{"id": r[0], "thread": r[1], "sender": r[2], "receiver": r[3], "timestamp": r[4], "text": r[5]} for r in rows]
        except Exception:
            # If FTS query fails, return empty list rather than crashing
            return []
