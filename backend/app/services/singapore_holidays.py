import json
import os
from datetime import datetime, date
from typing import List
from sqlalchemy.orm import Session

from app.models.holiday import Holiday

_SEEDS_PATH = os.path.join(
    os.path.dirname(__file__), "../../data/seeds/holidays.json"
)


def _load_static_holidays(year: int) -> List[dict]:
    """Load holidays from the bundled static JSON (no network call needed)."""
    with open(_SEEDS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return data.get(str(year), [])


def _upsert_holidays(records: List[dict], db: Session) -> List[Holiday]:
    fetched_at = datetime.utcnow().isoformat()
    stored = []
    for rec in records:
        date_str = rec["date"]
        d = date.fromisoformat(date_str)
        existing = db.query(Holiday).filter(Holiday.date == date_str).first()
        if existing:
            existing.name = rec["name"]
            existing.fetched_at = fetched_at
            stored.append(existing)
        else:
            h = Holiday(
                date=date_str,
                day_of_week=d.strftime("%A"),
                name=rec["name"],
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


async def sync_holidays(year: int, db: Session) -> List[Holiday]:
    """Load static holiday data for the year and upsert into DB."""
    records = _load_static_holidays(year)
    if not records:
        return []
    return _upsert_holidays(records, db)


def get_holidays_from_db(year: int, db: Session) -> List[Holiday]:
    return db.query(Holiday).filter(Holiday.year == year).order_by(Holiday.date).all()


async def get_or_sync_holidays(year: int, db: Session) -> List[Holiday]:
    holidays = get_holidays_from_db(year, db)
    if holidays:
        return holidays
    return await sync_holidays(year, db)
