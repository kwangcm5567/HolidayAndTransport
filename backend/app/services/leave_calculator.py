import json
from datetime import date, timedelta
from itertools import combinations
from typing import List, Set, Optional
from sqlalchemy.orm import Session

from app.models.holiday import Holiday
from app.models.leave_window import LeaveWindow
from app.utils.date_utils import is_free_day, is_workday, grow_streak


def _classify(n: int) -> str:
    if n == 0:
        return "no_leave"
    if n <= 2:
        return "take_1_2"
    return "take_3_5"


def _best_window_for_leave_count(
    anchor: date, n_leave: int, all_holidays: Set[date]
) -> Optional[dict]:
    """Find the optimal placement of n_leave AL days to maximise consecutive days off."""
    search_range = [anchor + timedelta(days=d) for d in range(-10, 11)]
    workdays = [d for d in search_range if is_workday(d, all_holidays)]

    if n_leave == 0:
        free_days = set(all_holidays)
        start, end = grow_streak(anchor, free_days)
        total = (end - start).days + 1
        return {
            "total": total,
            "start": start,
            "end": end,
            "leave_dates": [],
            "efficiency": None,
        }

    if n_leave > len(workdays):
        return None

    best: Optional[dict] = None
    for combo in combinations(workdays, n_leave):
        free_days = all_holidays | set(combo)
        start, end = grow_streak(anchor, free_days)
        total = (end - start).days + 1
        if best is None or total > best["total"]:
            best = {
                "total": total,
                "start": start,
                "end": end,
                "leave_dates": sorted(combo),
                "efficiency": round(total / n_leave, 2),
            }

    return best


def compute_windows_for_holiday(
    holiday: Holiday, all_holiday_dates: Set[date], max_leave: int = 5
) -> List[dict]:
    """
    Compute up to max_leave+1 windows for a single holiday (0..max_leave AL days).
    Returns list of window dicts, one per leave count.
    """
    anchor = date.fromisoformat(holiday.date)
    windows = []

    for n in range(0, max_leave + 1):
        w = _best_window_for_leave_count(anchor, n, all_holiday_dates)
        if w is None:
            continue
        windows.append({
            "holiday_id": holiday.id,
            "leave_days_required": n,
            "window_start": w["start"],
            "window_end": w["end"],
            "total_days_off": w["total"],
            "efficiency": w["efficiency"],
            "leave_dates": w["leave_dates"],
            "category": _classify(n),
        })

    return windows


def sync_leave_windows(holidays: List[Holiday], db: Session) -> List[LeaveWindow]:
    """Compute and persist leave windows for all given holidays."""
    all_dates: Set[date] = {date.fromisoformat(h.date) for h in holidays}

    # Clear existing windows for these holiday IDs
    holiday_ids = [h.id for h in holidays]
    db.query(LeaveWindow).filter(LeaveWindow.holiday_id.in_(holiday_ids)).delete(
        synchronize_session=False
    )
    db.flush()

    stored = []
    for holiday in holidays:
        windows = compute_windows_for_holiday(holiday, all_dates)
        for w in windows:
            lw = LeaveWindow(
                holiday_id=w["holiday_id"],
                leave_days_required=w["leave_days_required"],
                window_start=w["window_start"].isoformat(),
                window_end=w["window_end"].isoformat(),
                total_days_off=w["total_days_off"],
                efficiency=w["efficiency"],
                leave_dates=json.dumps([d.isoformat() for d in w["leave_dates"]]),
                category=w["category"],
            )
            db.add(lw)
            stored.append(lw)

    db.commit()
    for lw in stored:
        db.refresh(lw)
    return stored


def get_windows_from_db(
    year: int, db: Session, category: Optional[str] = None
) -> List[LeaveWindow]:
    from app.models.holiday import Holiday as HolidayModel

    q = (
        db.query(LeaveWindow)
        .join(HolidayModel, LeaveWindow.holiday_id == HolidayModel.id)
        .filter(HolidayModel.year == year)
    )
    if category and category != "all":
        q = q.filter(LeaveWindow.category == category)

    return q.order_by(HolidayModel.date, LeaveWindow.leave_days_required).all()
