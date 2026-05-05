import asyncio
import re
from datetime import datetime
from typing import List, Optional

from app.schemas.flight import FlightOffer, FlightSearchResponse, FlightSegment
from app.services.cache import cache_get, cache_set
from app.config import settings

# Google Flights city code → IATA airport mapping for URL
_CITY_TO_AIRPORT = {
    "TYO": "NRT", "OSA": "KIX", "SEL": "ICN",
}


def _resolve_iata(code: str) -> str:
    return _CITY_TO_AIRPORT.get(code, code)


def google_flights_url(
    origin: str,
    destination: str,
    outbound_date: str,
    return_date: str,
) -> str:
    """Generate a direct Google Flights search URL with pre-filled parameters."""
    dep = _resolve_iata(origin)
    arr = _resolve_iata(destination)
    # Format: https://www.google.com/flights#flt=SIN.BKK.2026-05-01*BKK.SIN.2026-05-04;c:SGD;e:1;s:0*1;sd:1;t:f
    return (
        f"https://www.google.com/flights#flt="
        f"{dep}.{arr}.{outbound_date}*{arr}.{dep}.{return_date}"
        f";c:SGD;e:1;s:0*1;sd:1;t:f"
    )


def skyscanner_url(
    origin: str,
    destination: str,
    outbound_date: str,
    return_date: str,
) -> str:
    dep = _resolve_iata(origin)
    arr = _resolve_iata(destination)
    out = outbound_date.replace("-", "")[2:]  # YYMMDD
    ret = return_date.replace("-", "")[2:]
    return f"https://www.skyscanner.com.sg/transport/flights/{dep.lower()}/{arr.lower()}/{out}/{ret}/"


async def scrape_google_flights(
    origin: str,
    destination: str,
    outbound_date: str,
    return_date: str,
    adults: int = 1,
) -> FlightSearchResponse:
    """
    Scrape Google Flights via Playwright headless browser.
    Falls back to empty offers list if blocked or Playwright not installed.
    Results are cached for FLIGHT_CACHE_TTL_HOURS to reduce scraping frequency.
    """
    cache_key = f"gf_scrape_{origin}_{destination}_{outbound_date}_{return_date}"
    now_str = datetime.utcnow().isoformat()

    cached = cache_get(cache_key)
    if cached:
        resp = FlightSearchResponse(**cached)
        resp.cached = True
        return resp

    offers: List[FlightOffer] = []

    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                locale="en-SG",
                timezone_id="Asia/Singapore",
            )
            page = await context.new_page()

            # Build search URL
            dep = _resolve_iata(origin)
            arr = _resolve_iata(destination)
            url = (
                f"https://www.google.com/flights#flt="
                f"{dep}.{arr}.{outbound_date}*{arr}.{dep}.{return_date}"
                f";c:SGD;e:1;s:0*1;sd:1;t:f"
            )

            await page.goto(url, wait_until="domcontentloaded", timeout=30_000)

            # Wait for flight results to appear
            try:
                await page.wait_for_selector(
                    'ul[class*="flight"] li, li[class*="pIav2d"], [jsname="IWWDBc"]',
                    timeout=20_000,
                )
            except Exception:
                # Try a simpler wait
                await asyncio.sleep(8)

            # Extract prices and airline names from visible text using aria-labels
            # Google Flights prices appear in elements with specific aria patterns
            price_elements = await page.query_selector_all(
                '[aria-label*="SGD"], [aria-label*="S$"], span[class*="YMlIz"]'
            )

            # Alternative: get all text blocks that look like prices
            content = await page.content()

            # Parse prices from page content using regex
            # Google Flights shows prices like "S$123" or "SGD 123"
            price_matches = re.findall(
                r'(?:S\$|SGD\s*)(\d{2,6})(?!\d)', content
            )
            airline_matches = re.findall(
                r'(?:Singapore Airlines|Scoot|AirAsia|Jetstar|Batik Air|'
                r'Thai Airways|EVA Air|ANA|JAL|Cathay Pacific|Korean Air|'
                r'Asiana|Vietnam Airlines|VietJet|Malindo|Malaysia Airlines|'
                r'IndiGo|Lion Air|Cebu Pacific)', content
            )

            await browser.close()

            # Pair up prices and airlines (best effort)
            seen_prices: set = set()
            for i, price_str in enumerate(price_matches[:15]):
                price = float(price_str)
                if price < 50 or price > 10000:  # filter noise
                    continue
                if price in seen_prices:
                    continue
                seen_prices.add(price)

                airline = airline_matches[i] if i < len(airline_matches) else "Various"
                offers.append(FlightOffer(
                    id=f"gf_{i}",
                    airline=airline,
                    price_sgd=price,
                    currency="SGD",
                    seats_available=None,
                    outbound_segments=[FlightSegment(
                        departure_iata=dep,
                        arrival_iata=arr,
                        departure_time=f"{outbound_date}T00:00:00",
                        arrival_time=f"{outbound_date}T03:00:00",
                        carrier_code=airline[:2].upper(),
                        flight_number="",
                        duration="",
                    )],
                    return_segments=[],
                    total_duration_outbound=None,
                    booking_class=None,
                ))

            offers.sort(key=lambda o: o.price_sgd)

    except ImportError:
        # Playwright not installed — return empty, UI will show link buttons
        pass
    except Exception:
        # Blocked or timeout — return empty, UI will show link buttons
        pass

    result = FlightSearchResponse(
        origin=origin,
        destination=destination,
        outbound_date=outbound_date,
        return_date=return_date,
        offers=offers,
        cached=False,
        searched_at=now_str,
    )

    if offers:  # only cache successful scrapes
        cache_set(cache_key, result.model_dump(), ttl_hours=settings.FLIGHT_CACHE_TTL_HOURS)

    return result
