from datetime import date, datetime
from typing import List, Optional
import httpx

from app.config import settings
from app.schemas.hotel import HotelOffer, HotelSearchResponse
from app.services.cache import cache_get, cache_set
from app.utils.amadeus_auth import get_amadeus_token, amadeus_base_url


async def _get_hotel_ids(city_code: str, token: str) -> List[str]:
    """Get list of hotel IDs for a city (up to 20 for offers search)."""
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{amadeus_base_url()}/v1/reference-data/locations/hotels/by-city",
            headers={"Authorization": f"Bearer {token}"},
            params={"cityCode": city_code, "radius": 10, "radiusUnit": "KM"},
        )
        if resp.status_code != 200:
            return []
        data = resp.json()

    hotel_ids = [h["hotelId"] for h in data.get("data", [])]
    return hotel_ids[:20]


def _nights(check_in: str, check_out: str) -> int:
    d1 = date.fromisoformat(check_in)
    d2 = date.fromisoformat(check_out)
    return max((d2 - d1).days, 1)


def _parse_offer(raw: dict, check_in: str, check_out: str, nights: int) -> Optional[HotelOffer]:
    try:
        hotel = raw.get("hotel", {})
        offers = raw.get("offers", [])
        if not offers:
            return None
        offer = offers[0]
        price_total = float(offer["price"]["total"])
        return HotelOffer(
            offer_id=offer["id"],
            hotel_id=hotel.get("hotelId", ""),
            hotel_name=hotel.get("name", "Unknown Hotel"),
            city_code=hotel.get("cityCode", ""),
            check_in=check_in,
            check_out=check_out,
            price_total_sgd=round(price_total, 2),
            price_per_night_sgd=round(price_total / nights, 2),
            room_type=offer.get("room", {}).get("typeEstimated", {}).get("category"),
            board_type=offer.get("boardType"),
            currency=offer["price"].get("currency", settings.CURRENCY),
        )
    except (KeyError, ValueError, ZeroDivisionError):
        return None


async def search_hotels(
    city_code: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
) -> HotelSearchResponse:
    cache_key = f"hotels_{city_code}_{check_in}_{check_out}_a{adults}"
    now_str = datetime.utcnow().isoformat()
    nights = _nights(check_in, check_out)

    cached = cache_get(cache_key)
    if cached:
        resp = HotelSearchResponse(**cached)
        resp.cached = True
        return resp

    if not settings.AMADEUS_CLIENT_ID:
        return HotelSearchResponse(
            city_code=city_code,
            check_in=check_in,
            check_out=check_out,
            nights=nights,
            offers=[],
            cached=False,
            searched_at=now_str,
        )

    token = await get_amadeus_token()
    hotel_ids = await _get_hotel_ids(city_code, token)
    if not hotel_ids:
        return HotelSearchResponse(
            city_code=city_code,
            check_in=check_in,
            check_out=check_out,
            nights=nights,
            offers=[],
            cached=False,
            searched_at=now_str,
        )

    async with httpx.AsyncClient(timeout=25) as client:
        resp = await client.get(
            f"{amadeus_base_url()}/v3/shopping/hotel-offers",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "hotelIds": ",".join(hotel_ids),
                "checkInDate": check_in,
                "checkOutDate": check_out,
                "adults": adults,
                "roomQuantity": 1,
                "currency": settings.CURRENCY,
                "bestRateOnly": "true",
            },
        )
        if resp.status_code != 200:
            offers_raw = []
        else:
            offers_raw = resp.json().get("data", [])

    offers = []
    for raw in offers_raw:
        offer = _parse_offer(raw, check_in, check_out, nights)
        if offer:
            offers.append(offer)

    offers.sort(key=lambda o: o.price_total_sgd)

    result = HotelSearchResponse(
        city_code=city_code,
        check_in=check_in,
        check_out=check_out,
        nights=nights,
        offers=offers,
        cached=False,
        searched_at=now_str,
    )
    cache_set(cache_key, result.model_dump(), ttl_hours=settings.HOTEL_CACHE_TTL_HOURS)
    return result
