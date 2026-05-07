from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.schemas.flight import FlightSearchResponse
from app.schemas.hotel import HotelSearchResponse
from app.services.amadeus_flights import search_flights
from app.services.amadeus_hotels import search_hotels
from app.services.playwright_flights import (
    google_flights_url, skyscanner_url,
    google_flights_url_nonstop, skyscanner_url_nonstop,
)
from app.config import settings

router = APIRouter(prefix="/search", tags=["search"])


class FlightLinksResponse(BaseModel):
    google_flights: str
    skyscanner: str


class SearchRequest(BaseModel):
    origin: str = settings.DEPARTURE_AIRPORT
    destination: str
    outbound_date: str
    return_date: str
    adults: int = 1


class SearchResponse(BaseModel):
    flights: FlightSearchResponse
    hotels: HotelSearchResponse
    flight_links: FlightLinksResponse


@router.post("", response_model=SearchResponse)
async def search_flights_and_hotels(req: SearchRequest):
    flights = await search_flights(req.origin, req.destination, req.outbound_date, req.return_date, req.adults)
    hotels = await search_hotels(req.destination, req.outbound_date, req.return_date, req.adults)
    links = FlightLinksResponse(
        google_flights=google_flights_url(req.origin, req.destination, req.outbound_date, req.return_date),
        skyscanner=skyscanner_url(req.origin, req.destination, req.outbound_date, req.return_date),
    )
    return SearchResponse(flights=flights, hotels=hotels, flight_links=links)


@router.get("/flights", response_model=FlightSearchResponse)
async def get_flights(
    destination: str = Query(...),
    outbound_date: str = Query(...),
    return_date: str = Query(...),
    adults: int = Query(default=1),
    origin: str = Query(default=settings.DEPARTURE_AIRPORT),
):
    return await search_flights(origin, destination, outbound_date, return_date, adults)


@router.get("/flight-links", response_model=FlightLinksResponse)
def get_flight_links(
    destination: str = Query(...),
    outbound_date: str = Query(...),
    return_date: str = Query(...),
    origin: str = Query(default=settings.DEPARTURE_AIRPORT),
):
    return FlightLinksResponse(
        google_flights=google_flights_url(origin, destination, outbound_date, return_date),
        skyscanner=skyscanner_url(origin, destination, outbound_date, return_date),
    )


@router.get("/hotels", response_model=HotelSearchResponse)
async def get_hotels(
    city_code: str = Query(...),
    check_in: str = Query(...),
    check_out: str = Query(...),
    adults: int = Query(default=2),
):
    return await search_hotels(city_code, check_in, check_out, adults)


class WeekendWindow(BaseModel):
    outbound_date: str
    return_date: str
    nights: int
    google_flights_url: str
    skyscanner_url: str


@router.get("/weekend-windows", response_model=List[WeekendWindow])
def get_weekend_windows(
    destination: str = Query(..., description="IATA city code, e.g. DPS"),
    weeks: int = Query(default=8, le=12),
    origin: str = Query(default=settings.DEPARTURE_AIRPORT),
):
    today = date.today()
    days_until_friday = (4 - today.weekday()) % 7 or 7
    first_friday = today + timedelta(days=days_until_friday)

    results = []
    for i in range(weeks):
        friday = first_friday + timedelta(weeks=i)
        sunday = friday + timedelta(days=2)
        outbound = friday.isoformat()
        ret = sunday.isoformat()
        results.append(WeekendWindow(
            outbound_date=outbound,
            return_date=ret,
            nights=2,
            google_flights_url=google_flights_url_nonstop(origin, destination, outbound, ret),
            skyscanner_url=skyscanner_url_nonstop(origin, destination, outbound, ret),
        ))
    return results
