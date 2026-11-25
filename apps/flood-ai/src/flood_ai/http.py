import hashlib
import json

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from flood_ai.config import CACHE_DIR

_session = requests.Session()
_session.mount(
    "https://",
    HTTPAdapter(
        max_retries=Retry(
            total=5,
            backoff_factor=1.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET",),
            # Fail fast instead of silently sleeping through long quota windows
            respect_retry_after_header=False,
        ),
        pool_maxsize=16,
    ),
)


def get_json(
    url: str,
    params: dict | None = None,
    *,
    cache: bool = True,
    timeout: float = 60,
    before_request=None,
):
    """GET a JSON document, optionally caching the raw response on disk."""
    cache_file = None
    if cache:
        key = hashlib.sha1(
            (url + json.dumps(params or {}, sort_keys=True)).encode()
        ).hexdigest()
        cache_file = CACHE_DIR / f"{key}.json"
        if cache_file.exists():
            return json.loads(cache_file.read_text(encoding="utf-8"))

    if before_request is not None:
        before_request()
    response = _session.get(url, params=params, timeout=timeout)
    response.raise_for_status()
    data = response.json() if response.content.strip() else None

    if cache_file is not None:
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(json.dumps(data), encoding="utf-8")
    return data
