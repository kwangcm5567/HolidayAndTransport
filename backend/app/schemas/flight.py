from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class FlightSegment(BaseModel):
    departure_iata: str
    arrival_iata: str
    departure_time: str
    arrival_time: str
    carrier_code: str
    flight_number: str
    duration: str


class FlightOffer(BaseModel):
    id: str
    airline: str
    price_sgd: float
    currency: str
    seats_available: Optional[int]
    outbound_segments: List[FlightSegment]
    return_segments: List[FlightSegment]
    total_duration_outbound: Optional[str]
    booking_class: Optional[str]


class FlightSearchResponse(BaseModel):
    origin: str
    destination: str
    outbound_date: str
    return_date: str
    offers: List[FlightOffer]
    cached: bool
    searched_at: str
