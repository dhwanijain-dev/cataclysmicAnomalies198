# main.py
import uvicorn
import os
import re
import shutil
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pathlib import Path
from extractor import extract_ufdr, parse_chat_file, parse_calls_file, parse_contacts_file
from indexer import Indexer
# transformers pipeline optional
try:
    from transformers import pipeline
except Exception:
    pipeline = None

UPLOAD_DIR = "uploads"
EXTRACT_DIR = "extracted"
for d in (UPLOAD_DIR, EXTRACT_DIR):
    os.makedirs(d, exist_ok=True)

app = FastAPI(title="UFDR Investigator Backend (backend-only)")

indexer = Indexer()

# Summarizer model can be disabled by setting env var SUMMARIZER_MODEL='' or not installing transformers.
SUMMARIZER_MODEL = os.environ.get("SUMMARIZER_MODEL", "google/flan-t5-small")
summarizer = None
if SUMMARIZER_MODEL and pipeline is not None:
    try:
        summarizer = pipeline("text2text-generation", model=SUMMARIZER_MODEL, truncation=True)
    except Exception as e:
        print("Summarizer pipeline init failed; summaries will be disabled:", e)
        summarizer = None

CRYPTO_PATTERNS = [
    re.compile(r"\b[13][A-HJ-NP-Za-km-z1-9]{25,34}\b"),  # BTC
    re.compile(r"\b0x[a-fA-F0-9]{40}\b"),                # ETH
]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload-ufdr")
async def upload_ufdr(file: UploadFile = File(...)):
    """
    Upload .ufdr/.zip OR standalone report.xml.
    If .xml, parsers will inspect it directly for messages/calls/contacts.
    """
    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as f:
        f.write(await file.read())

    base_stem = Path(file.filename).stem
    extract_path = os.path.join(EXTRACT_DIR, base_stem)
    if os.path.exists(extract_path):
        shutil.rmtree(extract_path)
    os.makedirs(extract_path, exist_ok=True)

    suffix = Path(file.filename).suffix.lower()
    manifest = None
    try:
        if suffix in (".ufdr", ".zip"):
            manifest = extract_ufdr(save_path, extract_path)
            extract_method = "zip/ufdr"
        elif suffix == ".xml":
            # preserve xml as report.xml and let parsers analyze it
            report_target = os.path.join(extract_path, "report.xml")
            shutil.copy2(save_path, report_target)
            manifest = {
                "root": extract_path,
                "report_xml": report_target,
                "chats": [report_target],
                "calls": [report_target],
                "contacts": [report_target],
                "media": []
            }
            extract_method = "standalone_report_xml"
        else:
            # try to unzip as a fallback
            try:
                manifest = extract_ufdr(save_path, extract_path)
                extract_method = "fallback_unzip"
            except Exception as e:
                return JSONResponse({"status": "error", "reason": f"Unsupported file type: {suffix}. unzip failed: {e}"}, status_code=400)
    except Exception as e:
        return JSONResponse({"status": "error", "reason": f"Extraction failed: {e}"}, status_code=500)

    total_messages = 0

    # accept both 'Content' (mistyped) and 'chats' keys — be tolerant
    chat_keys = []
    if "chats" in manifest:
        chat_keys = manifest.get("chats", [])
    elif "Content" in manifest:
        chat_keys = manifest.get("Content", [])
    else:
        chat_keys = manifest.get("chats", [])

    for chatfile in chat_keys:
        try:
            msgs = parse_chat_file(chatfile)
            if msgs:
                indexer.add_messages(msgs)
                total_messages += len(msgs)
        except Exception as e:
            print(f"parse_chat_file failed for {chatfile}: {e}")

    for cfile in manifest.get("contacts", []):
        try:
            contacts = parse_contacts_file(cfile)
            # optional: persist contacts in DB (extension)
        except Exception as e:
            print(f"parse_contacts_file failed for {cfile}: {e}")

    for callfile in manifest.get("calls", []):
        try:
            calls = parse_calls_file(callfile)
            call_msgs = []
            for c in calls:
                call_msgs.append({
                    "thread": None,
                    "sender": c.get("number"),
                    "receiver": None,
                    "timestamp": c.get("timestamp"),
                    "text": f"Call record type:{c.get('type')} duration:{c.get('duration')}"
                })
            if call_msgs:
                indexer.add_messages(call_msgs)
                total_messages += len(call_msgs)
        except Exception as e:
            print(f"parse_calls_file failed for {callfile}: {e}")

    # compute embeddings (no-op if embeddings disabled)
    try:
        indexer.compute_and_store_embeddings()
    except Exception as e:
        print("embedding build failed:", e)

    return JSONResponse({
        "status": "ok",
        "messages_indexed": total_messages,
        "extract_method": extract_method,
        "manifest_counts": {k: len(v) for k, v in manifest.items() if isinstance(v, list)}
    })


@app.post("/query")
async def query(q: str = Form(...)):
    qlower = q.lower()
    if any(tok in qlower for tok in ("crypto", "bitcoin", "ethereum", "wallet")):
        cur = indexer.conn.cursor()
        rows = cur.execute("SELECT id,text FROM messages LIMIT 20000;").fetchall()
        hits = []
        for r in rows:
            txt = r[1] or ""
            for pat in CRYPTO_PATTERNS:
                m = pat.search(txt)
                if m:
                    hits.append({"id": r[0], "text": txt, "match": m.group(0)})
        summary = None
        if hits and summarizer:
            try:
                joined = "\n".join([h["text"] for h in hits[:10]])
                summary = summarizer("summarize: " + joined, max_length=128, do_sample=False)[0]["generated_text"]
            except Exception:
                summary = joined[:1000]
        return JSONResponse({"query": q, "mode": "crypto_regex", "count": len(hits), "hits": hits, "summary": summary})

    fts_hits = indexer.fts_search(q, limit=20)
    semantic_hits = indexer.semantic_search(q, top_k=10)
    bucket = {}
    for h in (fts_hits or []) + (semantic_hits or []):
        if not h:
            continue
        bucket[h["id"]] = h
    merged = list(bucket.values())[:25]

    summary = None
    if merged and summarizer:
        try:
            joined = "\n\n".join([f"{m.get('sender') or ''}: {m.get('text')}" for m in merged[:10]])
            summary = summarizer("summarize: " + joined, max_length=120, do_sample=False)[0]["generated_text"]
        except Exception as e:
            print("summarizer failed", e)

    return JSONResponse({"query": q, "count": len(merged), "results": merged, "summary": summary})


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
