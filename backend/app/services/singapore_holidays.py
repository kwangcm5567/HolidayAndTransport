import httpx
from datetime import datetime, date
from typing import List
from sqlalchemy.orm import Session

from app.config import settings
from app.models.holiday import Holiday
from app.services.cache import cache_get, cache_set


async def fetch_holidays_from_api(year: int) -> List[dict]:
    """Fetch SG public holidays from data.gov.sg for a given year."""
    cache_key = f"sg_holidays_{year}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    url = "https://data.gov.sg/api/action/datastore_search"
    params = {
        "resource_id": settings.SG_HOLIDAYS_RESOURCE_ID,
        "limit": 100,
        "q": str(year),
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    records = data.get("result", {}).get("records", [])
    holidays = [r for r in records if str(r.get("date", "")).startswith(str(year))]

    cache_set(cache_key, holidays, ttl_hours=settings.HOLIDAY_CACHE_TTL_HOURS)
    return holidays


async def sync_holidays(year: int, db: Session) -> List[Holiday]:
    """Fetch holidays from API and upsert into DB. Returns the stored Holiday ORM objects."""
    raw = await fetch_holidays_from_api(year)
    fetched_at = datetime.utcnow().isoformat()
    stored = []

    for rec in raw:
        date_str = rec.get("date", "")
        if not date_str:
            continue

        try:
            d = date.fromisoformat(date_str)
        except ValueError:
            continue

        name = rec.get("holiday", rec.get("name", "Unknown Holiday"))
        existing = db.query(Holiday).filter(Holiday.date == date_str).first()

        if existing:
            existing.name = name
            existing.day_of_week = d.strftime("%A")
            existing.fetched_at = fetched_at
            stored.append(existing)
        else:
            h = Holiday(
                date=date_str,
                day_of_week=d.strftime("%A"),
                name=name,
                year=d.year,
                is_observed=False,
                fetched_at=fetched_at,
            )
            db.add(h)
            stored.append(h)

    db.commit()
    for h in stored:
        db.refresh(h)
    return stored


def get_holidays_from_db(year: int, db: Session) -> List[Holiday]:
    return db.query(Holiday).filter(Holiday.year == year).order_by(Holiday.date).all()


async def get_or_sync_holidays(year: int, db: Session) -> List[Holiday]:
    """Return from DB if present, otherwise fetch from API and store."""
    holidays = get_holidays_from_db(year, db)
    if holidays:
        return holidays
    return await sync_holidays(year, db)
