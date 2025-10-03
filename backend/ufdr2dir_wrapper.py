# ufdr2dir_wrapper.py
import subprocess
import os
from pathlib import Path
from typing import Optional

def run_ufdr2dir(ufdr_path: str, out_dir: str, ufdr2dir_repo: Optional[str] = None, timeout: int = 300) -> bool:
    """
    Optional helper to run UFDR2DIR if you have it cloned.
    If not available, caller should fallback to extract_ufdr.
    """
    ufdr_path = str(ufdr_path)
    out_dir = str(out_dir)
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    candidates = []
    if ufdr2dir_repo:
        candidates.append(Path(ufdr2dir_repo) / "ufdr2dir.py")
        candidates.append(Path(ufdr2dir_repo) / "UFDR2DIR.py")
    candidates.append(Path.cwd() / "ufdr2dir.py")

    script = next((c for c in candidates if c.exists()), None)
    try:
        if script:
            cmd = ["python", str(script), ufdr_path, out_dir]
            subprocess.check_call(cmd, timeout=timeout)
            return any(Path(out_dir).iterdir())
    except Exception:
        return False
    return False
