from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from enum import Enum


class LeaveCategory(str, Enum):
    NO_LEAVE = "no_leave"
    TAKE_1_2 = "take_1_2"
    TAKE_3_5 = "take_3_5"


class TravelWindowResponse(BaseModel):
    id: int
    holiday_id: int
    holiday_name: str
    holiday_date: date
    holiday_day_of_week: str
    leave_days_required: int
    window_start: date
    window_end: date
    total_days_off: int
    efficiency: Optional[float]
    leave_dates: List[date]
    category: LeaveCategory

    model_config = {"from_attributes": True}
