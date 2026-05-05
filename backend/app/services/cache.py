import json
import os
import time
from typing import Any, Optional
from app.config import settings


def _cache_path(key: str) -> str:
    os.makedirs(settings.CACHE_DIR, exist_ok=True)
    safe_key = key.replace("/", "_").replace(":", "_")
    return os.path.join(settings.CACHE_DIR, f"{safe_key}.json")


def cache_get(key: str) -> Optional[Any]:
    path = _cache_path(key)
    if not os.path.exists(path):
        return None
    try:
        with open(path) as f:
            entry = json.load(f)
        if time.time() > entry["expires_at"]:
            os.remove(path)
            return None
        return entry["data"]
    except (json.JSONDecodeError, KeyError, OSError):
        return None


def cache_set(key: str, data: Any, ttl_hours: float) -> None:
    path = _cache_path(key)
    tmp_path = path + ".tmp"
    entry = {
        "key": key,
        "created_at": time.time(),
        "expires_at": time.time() + ttl_hours * 3600,
        "data": data,
    }
    with open(tmp_path, "w") as f:
        json.dump(entry, f)
    os.replace(tmp_path, path)
