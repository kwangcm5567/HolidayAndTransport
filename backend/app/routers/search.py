from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from app.schemas.flight import FlightSearchResponse
from app.schemas.hotel import HotelSearchResponse
from app.services.amadeus_flights import search_flights
from app.services.amadeus_hotels import search_hotels
from app.config import settings

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    origin: str = settings.DEPARTURE_AIRPORT
    destination: str
    outbound_date: str
    return_date: str
    adults: int = 1


class SearchResponse(BaseModel):
    flights: FlightSearchResponse
    hotels: HotelSearchResponse


@router.post("", response_model=SearchResponse)
async def search_flights_and_hotels(req: SearchRequest):
    flights = await search_flights(
        origin=req.origin,
        destination=req.destination,
        outbound_date=req.outbound_date,
        return_date=req.return_date,
        adults=req.adults,
    )
    hotels = await search_hotels(
        city_code=req.destination,
        check_in=req.outbound_date,
        check_out=req.return_date,
        adults=req.adults,
    )
    return SearchResponse(flights=flights, hotels=hotels)


@router.get("/flights", response_model=FlightSearchResponse)
async def get_flights(
    destination: str = Query(...),
    outbound_date: str = Query(...),
    return_date: str = Query(...),
    adults: int = Query(default=1),
    origin: str = Query(default=settings.DEPARTURE_AIRPORT),
):
    return await search_flights(origin, destination, outbound_date, return_date, adults)


@router.get("/hotels", response_model=HotelSearchResponse)
async def get_hotels(
    city_code: str = Query(...),
    check_in: str = Query(...),
    check_out: str = Query(...),
    adults: int = Query(default=2),
):
    return await search_hotels(city_code, check_in, check_out, adults)
