from pydantic import BaseModel
from typing import List


class Destination(BaseModel):
    city_code: str
    city_name: str
    country: str
    amadeus_city_code: str
    flight_hours: float
    category: str  # short_trip / regional / long_haul
    popular_rank: int


class PopularDestinationsResponse(BaseModel):
    short_trips: List[Destination]
    regional: List[Destination]
    long_haul: List[Destination]
