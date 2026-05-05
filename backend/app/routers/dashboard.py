import json
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.dashboard import DashboardResponse, HolidayWindowSummary, DestinationDeal
from app.services.singapore_holidays import get_or_sync_holidays
from app.services.leave_calculator import get_windows_from_db, sync_leave_windows
from app.routers.destinations import _load_destinations
from app.models.holiday import Holiday

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    year: int = Query(default=2026),
    category: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    holidays = await get_or_sync_holidays(year, db)
    windows = get_windows_from_db(year, db, category)

    if not windows:
        windows = sync_leave_windows(holidays, db)
        if category and category != "all":
            windows = [w for w in windows if w.category == category]

    holiday_map = {h.id: h for h in holidays}
    destinations = _load_destinations()

    window_summaries: List[HolidayWindowSummary] = []
    seen = set()  # deduplicate by (holiday_id, category)

    for w in windows:
        h = holiday_map.get(w.holiday_id)
        if not h:
            continue

        key = (w.holiday_id, w.category)
        if key in seen:
            continue
        seen.add(key)

        deals: List[DestinationDeal] = []
        for dest in destinations:
            nights = (
                datetime.fromisoformat(w.window_end) - datetime.fromisoformat(w.window_start)
            ).days
            deals.append(DestinationDeal(
                city_code=dest.city_code,
                city_name=dest.city_name,
                country=dest.country,
                cheapest_flight_sgd=None,
                cheapest_hotel_total_sgd=None,
                total_estimated_sgd=None,
                nights=nights,
                flight_hours=dest.flight_hours,
            ))

        window_summaries.append(HolidayWindowSummary(
            holiday_id=w.holiday_id,
            holiday_name=h.name,
            holiday_date=h.date,
            holiday_day_of_week=h.day_of_week,
            leave_window_id=w.id,
            leave_days_required=w.leave_days_required,
            category=w.category,
            window_start=w.window_start,
            window_end=w.window_end,
            total_days_off=w.total_days_off,
            efficiency=w.efficiency,
            leave_dates=json.loads(w.leave_dates),
            deals=deals,
        ))

    return DashboardResponse(
        year=year,
        total_holidays=len(holidays),
        windows=window_summaries,
        last_updated=datetime.utcnow().isoformat(),
    )
