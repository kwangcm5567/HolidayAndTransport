import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.schemas.travel_window import TravelWindowResponse
from app.services.leave_calculator import get_windows_from_db, sync_leave_windows
from app.services.singapore_holidays import get_or_sync_holidays
from app.models.holiday import Holiday

router = APIRouter(prefix="/windows", tags=["windows"])


@router.get("", response_model=List[TravelWindowResponse])
async def get_travel_windows(
    year: int = Query(default=2026),
    category: Optional[str] = Query(default=None, description="no_leave / take_1_2 / take_3_5 / all"),
    db: Session = Depends(get_db),
):
    holidays = await get_or_sync_holidays(year, db)
    windows = get_windows_from_db(year, db, category)

    if not windows:
        windows = sync_leave_windows(holidays, db)
        if category and category != "all":
            windows = [w for w in windows if w.category == category]

    result = []
    holiday_map = {h.id: h for h in holidays}
    for w in windows:
        h = holiday_map.get(w.holiday_id)
        if not h:
            continue
        result.append(TravelWindowResponse(
            id=w.id,
            holiday_id=w.holiday_id,
            holiday_name=h.name,
            holiday_date=date.fromisoformat(h.date),
            holiday_day_of_week=h.day_of_week,
            leave_days_required=w.leave_days_required,
            window_start=date.fromisoformat(w.window_start),
            window_end=date.fromisoformat(w.window_end),
            total_days_off=w.total_days_off,
            efficiency=w.efficiency,
            leave_dates=[date.fromisoformat(d) for d in json.loads(w.leave_dates)],
            category=w.category,
        ))

    return result
