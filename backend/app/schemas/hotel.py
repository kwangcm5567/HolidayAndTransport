from pydantic import BaseModel
from typing import Optional, List


class HotelOffer(BaseModel):
    offer_id: str
    hotel_id: str
    hotel_name: str
    city_code: str
    check_in: str
    check_out: str
    price_total_sgd: float
    price_per_night_sgd: float
    room_type: Optional[str]
    board_type: Optional[str]
    currency: str


class HotelSearchResponse(BaseModel):
    city_code: str
    check_in: str
    check_out: str
    nights: int
    offers: List[HotelOffer]
    cached: bool
    searched_at: str
