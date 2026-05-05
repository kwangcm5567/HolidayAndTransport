from pydantic import BaseModel
from datetime import date


class HolidayResponse(BaseModel):
    id: int
    date: date
    day_of_week: str
    name: str
    year: int
    is_observed: bool

    model_config = {"from_attributes": True}
