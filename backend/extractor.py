# extractor.py
import os
import zipfile
import json
from lxml import etree
from pathlib import Path
from typing import List, Dict, Any

def ensure_dir(p):
    os.makedirs(p, exist_ok=True)


def extract_ufdr(ufdr_path: str, out_dir: str) -> Dict[str, Any]:
    """
    Unzip a .ufdr/.zip into out_dir and return a manifest.
    Manifest keys: root, report_xml, chats, calls, contacts, media
    """
    ensure_dir(out_dir)
    # try unzip (UFDR is ZIP-like)
    with zipfile.ZipFile(ufdr_path, 'r') as z:
        z.extractall(out_dir)

    # locate report.xml (best-effort)
    report_paths = list(Path(out_dir).rglob("report.xml"))
    if not report_paths:
        report_paths = list(Path(out_dir).rglob("*.xml"))
    report_xml = str(report_paths[0]) if report_paths else None

    manifest = {
        "root": out_dir,
        "report_xml": report_xml,
        "chats": [],
        "calls": [],
        "contacts": [],
        "media": []
    }

    # if report.xml is available, attempt to map <file> entries and also consider
    # possibility that report.xml contains actual message elements.
    if report_xml:
        try:
            tree = etree.parse(report_xml)
            root = tree.getroot()
            # collect <file> nodes referencing localPath or similar attributes
            file_nodes = root.findall(".//file")
            for f in file_nodes:
                local = f.findtext("localPath") or f.findtext("LocalPath") or f.get("localPath") or f.get("path")
                if not local:
                    continue
                abspath = os.path.join(out_dir, local) if not os.path.isabs(local) else local
                if os.path.exists(abspath):
                    low = local.lower()
                    if any(tok in low for tok in ("chat","message","sms","im","conversation")):
                        manifest["chats"].append(abspath)
                    elif "call" in low:
                        manifest["calls"].append(abspath)
                    elif "contact" in low or low.endswith(".vcf"):
                        manifest["contacts"].append(abspath)
                    elif any(tok in low for tok in ("image","photo","video","audio","media","files")):
                        manifest["media"].append(abspath)
            # Also, sometimes report.xml itself contains <message>, <sms>, <call>, <contact> nodes:
            # If so, add report.xml to lists so parsers will inspect it.
            text = Path(report_xml).read_text(encoding="utf-8", errors="ignore").lower()
            if any(k in text for k in ("<message", "<sms", "<chat", "<conversation")):
                manifest["chats"].append(report_xml)
            if "<call" in text or "<callrecord" in text:
                manifest["calls"].append(report_xml)
            if "<contact" in text or "<vcard" in text or "displayname" in text:
                manifest["contacts"].append(report_xml)
        except Exception:
            # if parsing report.xml fails, fall back to directory scan below
            pass

    # fallback: scan extracted tree for likely files
    for p in Path(out_dir).rglob("*"):
        if not p.is_file():
            continue
        low = str(p).lower()
        if low.endswith((".json", ".xml", ".txt")):
            name = p.name.lower()
            # heuristics by name
            if any(tok in name for tok in ("chat","message","sms","im","conversation")):
                manifest["chats"].append(str(p))
            elif any(tok in name for tok in ("call","calllog","calls")):
                manifest["calls"].append(str(p))
            elif any(tok in name for tok in ("contact","phonebook",".vcf","vcard")):
                manifest["contacts"].append(str(p))
        if any(tok in low for tok in ("image","photo","video","audio")):
            manifest["media"].append(str(p))

    # dedupe
    for k in ("chats","calls","contacts","media"):
        manifest[k] = list(dict.fromkeys(manifest[k]))
    return manifest


def parse_chat_file(path: str) -> List[Dict[str, Any]]:
    """
    Parse a file (JSON or XML) that may contain chat messages.
    Returns list of messages: {thread, sender, receiver, timestamp, text, raw}
    Robustly handles:
      - JSON chat exports with common keys (messages, chat, items, data, conversations)
      - UFDR-style XML: <UFDR_Report><Chats><Conversation ...><Message>...<Content>...</Message>
    """
    results = []
    try:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")
        stripped = text.lstrip()
        # JSON path
        if stripped.startswith("{") or stripped.startswith("["):
            obj = json.loads(text)
            messages = None
            # common keys
            if isinstance(obj, dict):
                for candidate in ("messages","chat","items","data","conversations","threads","messagesList"):
                    if candidate in obj:
                        messages = obj[candidate]
                        break
                if messages is None:
                    # fallback: find first value that's a list of dicts
                    for k,v in obj.items():
                        if isinstance(v, list) and v and isinstance(v[0], dict):
                            messages = v
                            break
            elif isinstance(obj, list):
                messages = obj
            if messages:
                for m in messages:
                    if not isinstance(m, dict):
                        continue
                    text_field = m.get("text") or m.get("message") or m.get("body") or m.get("content") or ""
                    results.append({
                        "thread": m.get("thread_id") or m.get("chat_id") or m.get("conversationId") or m.get("thread"),
                        "sender": m.get("sender") or m.get("from") or m.get("author"),
                        "receiver": m.get("to") or m.get("recipients"),
                        "timestamp": m.get("timestamp") or m.get("date") or m.get("time"),
                        "text": text_field,
                        "raw": m
                    })
            return results

        # XML path
        xmlroot = etree.fromstring(text.encode("utf-8"))

        # Try to extract device identifier (phone number) from Metadata if present
        device_phone = None
        try:
            dp = xmlroot.find(".//DeviceInformation/PhoneNumber")
            if dp is not None and dp.text:
                device_phone = dp.text.strip()
        except Exception:
            device_phone = None

        # UFDR-style Conversations: <Chats><Conversation ...> ... <Message><Content>...</Message>
        # Accept Conversation as either attribute-based or child-element-based.
        conv_nodes = xmlroot.findall(".//Chats/Conversation")
        if conv_nodes:
            for conv in conv_nodes:
                # participant info
                participant_id = conv.get("ParticipantID") or (conv.findtext("ParticipantID") if conv.find("ParticipantID") is not None else None)
                participant_name = conv.get("ParticipantName") or (conv.findtext("ParticipantName") if conv.find("ParticipantName") is not None else None)
                app = conv.get("App") or conv.findtext("App")
                thread_id = f"{app}:{participant_id or participant_name}"

                # iterate messages
                for msg in conv.findall(".//Message"):
                    ts = (msg.findtext("Timestamp") or msg.findtext("Date") or msg.findtext("Time") or "").strip()
                    direction = (msg.findtext("Direction") or "").strip()
                    # Content node may be <Content> or <Body> etc
                    content = (msg.findtext("Content") or msg.findtext("Body") or msg.findtext("Text") or "").strip()
                    if not content:
                        # sometimes text is directly under message node as text
                        content = (msg.text or "").strip()
                    # Build sender/receiver heuristics
                    if direction.lower().startswith("out"):
                        sender = device_phone or "device"
                        receiver = participant_id or participant_name
                    else:
                        sender = participant_id or participant_name
                        receiver = device_phone or None

                    results.append({
                        "thread": thread_id,
                        "sender": sender,
                        "receiver": receiver,
                        "timestamp": ts,
                        "text": content,
                        "raw": etree.tostring(msg, encoding="utf-8", pretty_print=True).decode("utf-8")
                    })
            return results

        # Generic XML: try to find message-like nodes anywhere
        nodes = xmlroot.findall(".//message") + xmlroot.findall(".//chatmessage") + xmlroot.findall(".//sms") + xmlroot.findall(".//conversation")
        if nodes:
            for msg in nodes:
                body = (msg.findtext("body") or msg.findtext("text") or (msg.text or "")).strip()
                results.append({
                    "thread": msg.get("thread") or msg.findtext("thread"),
                    "sender": msg.get("from") or msg.findtext("from") or msg.findtext("sender"),
                    "receiver": msg.get("to") or msg.findtext("to") or msg.findtext("recipient"),
                    "timestamp": msg.get("date") or msg.findtext("date") or msg.findtext("time"),
                    "text": body,
                    "raw": etree.tostring(msg, encoding="utf-8", pretty_print=True).decode("utf-8")
                })
    except Exception:
        # tolerant: return whatever we parsed so far
        pass
    return results


def parse_contacts_file(path: str) -> List[Dict[str, Any]]:
    """
    Parse contacts (json/xml/vcf). Returns list of {name, phones, emails}
    Handles UFDR <Contacts><Contact> entries too.
    """
    results = []
    try:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")
        stripped = text.lstrip()
        if stripped.startswith("{") or stripped.startswith("["):
            obj = json.loads(text)
            candidates = None
            if isinstance(obj, dict):
                for candidate in ("contacts","items","data","phonebook"):
                    if candidate in obj:
                        candidates = obj[candidate]; break
                if candidates is None:
                    for k,v in obj.items():
                        if isinstance(v, list) and v and isinstance(v[0], dict):
                            candidates = v; break
            elif isinstance(obj, list):
                candidates = obj
            if candidates:
                for c in candidates:
                    results.append({
                        "name": c.get("name") or c.get("displayName"),
                        "phones": c.get("phones") or c.get("numbers") or c.get("tel") or [],
                        "emails": c.get("emails") or []
                    })
            return results

        # XML path
        xmlroot = etree.fromstring(text.encode("utf-8"))
        # UFDR-style Contacts
        contact_nodes = xmlroot.findall(".//Contacts/Contact")
        for c in contact_nodes:
            name = (c.findtext("Name") or c.findtext("displayName") or c.findtext("FullName") or "").strip()
            phone = (c.findtext("PhoneNumber") or c.findtext("Phone") or "").strip()
            email = (c.findtext("Email") or "").strip()
            phones = [phone] if phone else []
            emails = [email] if email else []
            results.append({"name": name, "phones": phones, "emails": emails})

        # Generic XML contact nodes
        xml_contacts = xmlroot.findall(".//contact") + xmlroot.findall(".//contactEntry")
        for c in xml_contacts:
            name = c.findtext("displayName") or c.findtext("name")
            phones = [p.text for p in c.findall(".//phone")] if c.findall(".//phone") else []
            emails = [e.text for e in c.findall(".//email")] if c.findall(".//email") else []
            results.append({"name": name, "phones": phones, "emails": emails})
    except Exception:
        pass
    return results


def parse_calls_file(path: str) -> List[Dict[str, Any]]:
    """
    Parse call logs (json or xml). Returns list of {number, type, timestamp, duration}
    Handles UFDR <CallLogs><Call> entries.
    """
    results = []
    try:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")
        stripped = text.lstrip()
        if stripped.startswith("{") or stripped.startswith("["):
            obj = json.loads(text)
            candidates = None
            if isinstance(obj, dict):
                for candidate in ("calls","items","data","calllog"):
                    if candidate in obj:
                        candidates = obj[candidate]; break
                if candidates is None:
                    for k,v in obj.items():
                        if isinstance(v, list) and v and isinstance(v[0], dict):
                            candidates = v; break
            elif isinstance(obj, list):
                candidates = obj
            if candidates:
                for c in candidates:
                    results.append({
                        "number": c.get("number") or c.get("phone") or c.get("caller"),
                        "type": c.get("type") or c.get("callType") or c.get("direction"),
                        "timestamp": c.get("timestamp") or c.get("date"),
                        "duration": c.get("duration") or c.get("durationSeconds") or c.get("DurationSeconds")
                    })
            return results

        # XML path
        xmlroot = etree.fromstring(text.encode("utf-8"))
        call_nodes = xmlroot.findall(".//CallLogs/Call")
        for c in call_nodes:
            ts = (c.findtext("Timestamp") or c.findtext("Date") or "").strip()
            direction = (c.findtext("Direction") or "").strip()
            number = (c.findtext("Number") or c.findtext("PhoneNumber") or c.findtext("Caller") or "").strip()
            duration = (c.findtext("DurationSeconds") or c.findtext("duration") or "").strip()
            results.append({
                "number": number,
                "type": direction,
                "timestamp": ts,
                "duration": duration
            })

        # generic <call> nodes
        xml_calls = xmlroot.findall(".//call") + xmlroot.findall(".//callEntry")
        for c in xml_calls:
            results.append({
                "number": c.findtext("number") or c.findtext("caller"),
                "type": c.findtext("type") or c.findtext("direction"),
                "timestamp": c.findtext("date") or c.findtext("time"),
                "duration": c.findtext("duration")
            })
    except Exception:
        pass
    return results
