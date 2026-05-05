from pydantic import BaseModel
from typing import Optional, List
from app.schemas.travel_window import LeaveCategory


class DestinationDeal(BaseModel):
    city_code: str
    city_name: str
    country: str
    cheapest_flight_sgd: Optional[float]
    cheapest_hotel_total_sgd: Optional[float]
    total_estimated_sgd: Optional[float]
    nights: int
    flight_hours: Optional[float]


class HolidayWindowSummary(BaseModel):
    holiday_id: int
    holiday_name: str
    holiday_date: str
    holiday_day_of_week: str
    leave_window_id: int
    leave_days_required: int
    category: LeaveCategory
    window_start: str
    window_end: str
    total_days_off: int
    efficiency: Optional[float]
    leave_dates: List[str]
    deals: List[DestinationDeal]


class DashboardResponse(BaseModel):
    year: int
    total_holidays: int
    windows: List[HolidayWindowSummary]
    last_updated: str
