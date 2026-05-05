from datetime import date, timedelta
from typing import Set


def is_weekend(d: date) -> bool:
    return d.weekday() >= 5


def is_free_day(d: date, holidays: Set[date]) -> bool:
    return is_weekend(d) or d in holidays


def is_workday(d: date, holidays: Set[date]) -> bool:
    return not is_free_day(d, holidays)


def date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def get_day_name(d: date) -> str:
    return d.strftime("%A")


def grow_streak(anchor: date, free_days: Set[date]) -> tuple[date, date]:
    """Expand a streak outward from anchor through consecutive free days."""
    start = anchor
    while is_free_day(start - timedelta(days=1), free_days):
        start -= timedelta(days=1)
    end = anchor
    while is_free_day(end + timedelta(days=1), free_days):
        end += timedelta(days=1)
    return start, end
