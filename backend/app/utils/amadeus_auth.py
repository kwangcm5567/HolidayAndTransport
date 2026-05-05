import time
import httpx
from app.config import settings

_token_cache: dict = {"token": None, "expires_at": 0}


def _base_url() -> str:
    if settings.AMADEUS_ENV == "production":
        return "https://api.amadeus.com"
    return "https://test.api.amadeus.com"


async def get_amadeus_token() -> str:
    """Return a valid Amadeus OAuth2 token, refreshing if within 60s of expiry."""
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_base_url()}/v1/security/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": settings.AMADEUS_CLIENT_ID,
                "client_secret": settings.AMADEUS_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 1799)
    return _token_cache["token"]


def amadeus_base_url() -> str:
    return _base_url()
