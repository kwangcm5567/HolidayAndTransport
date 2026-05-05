from datetime import datetime
from typing import List, Optional
import httpx

from app.config import settings
from app.schemas.flight import FlightOffer, FlightSearchResponse, FlightSegment
from app.services.cache import cache_get, cache_set
from app.utils.amadeus_auth import get_amadeus_token, amadeus_base_url


def _parse_duration(iso: str) -> str:
    """Convert PT2H30M to '2h 30m'."""
    iso = iso.replace("PT", "")
    result = iso.replace("H", "h ").replace("M", "m").strip()
    return result


def _parse_segment(seg: dict) -> FlightSegment:
    dep = seg.get("departure", {})
    arr = seg.get("arrival", {})
    return FlightSegment(
        departure_iata=dep.get("iataCode", ""),
        arrival_iata=arr.get("iataCode", ""),
        departure_time=dep.get("at", ""),
        arrival_time=arr.get("at", ""),
        carrier_code=seg.get("carrierCode", ""),
        flight_number=seg.get("number", ""),
        duration=_parse_duration(seg.get("duration", "PT0H")),
    )


def _parse_offer(raw: dict) -> Optional[FlightOffer]:
    try:
        price = float(raw["price"]["grandTotal"])
        itineraries = raw.get("itineraries", [])
        if not itineraries:
            return None

        outbound_segs = [_parse_segment(s) for s in itineraries[0].get("segments", [])]
        return_segs = [_parse_segment(s) for s in itineraries[1].get("segments", [])] if len(itineraries) > 1 else []
        carrier = outbound_segs[0].carrier_code if outbound_segs else ""

        traveler_pricing = raw.get("travelerPricings", [{}])[0]
        fare_details = traveler_pricing.get("fareDetailsBySegment", [{}])
        booking_class = fare_details[0].get("class") if fare_details else None
        seats_str = raw.get("numberOfBookableSeats")

        return FlightOffer(
            id=raw["id"],
            airline=carrier,
            price_sgd=price,
            currency=raw["price"].get("currency", settings.CURRENCY),
            seats_available=int(seats_str) if seats_str else None,
            outbound_segments=outbound_segs,
            return_segments=return_segs,
            total_duration_outbound=_parse_duration(itineraries[0].get("duration", "PT0H")),
            booking_class=booking_class,
        )
    except (KeyError, IndexError, ValueError):
        return None


async def search_flights(
    origin: str,
    destination: str,
    outbound_date: str,
    return_date: str,
    adults: int = 1,
    max_results: int = 10,
) -> FlightSearchResponse:
    cache_key = f"flights_{origin}_{destination}_{outbound_date}_{return_date}_a{adults}"
    now_str = datetime.utcnow().isoformat()

    cached = cache_get(cache_key)
    if cached:
        resp = FlightSearchResponse(**cached)
        resp.cached = True
        return resp

    if not settings.AMADEUS_CLIENT_ID:
        return FlightSearchResponse(
            origin=origin,
            destination=destination,
            outbound_date=outbound_date,
            return_date=return_date,
            offers=[],
            cached=False,
            searched_at=now_str,
        )

    token = await get_amadeus_token()
    params = {
        "originLocationCode": origin,
        "destinationLocationCode": destination,
        "departureDate": outbound_date,
        "returnDate": return_date,
        "adults": adults,
        "currencyCode": settings.CURRENCY,
        "max": max_results,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{amadeus_base_url()}/v2/shopping/flight-offers",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    offers = []
    for raw in data.get("data", []):
        offer = _parse_offer(raw)
        if offer:
            offers.append(offer)

    offers.sort(key=lambda o: o.price_sgd)

    result = FlightSearchResponse(
        origin=origin,
        destination=destination,
        outbound_date=outbound_date,
        return_date=return_date,
        offers=offers,
        cached=False,
        searched_at=now_str,
    )
    cache_set(cache_key, result.model_dump(), ttl_hours=settings.FLIGHT_CACHE_TTL_HOURS)
    return result
