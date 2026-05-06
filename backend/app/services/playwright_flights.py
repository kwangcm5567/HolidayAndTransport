"""
Deep-link URL generators for Google Flights and Skyscanner.
No scraping, no browser — just pre-filled search URLs for the frontend.
"""

_CITY_TO_AIRPORT = {
    "TYO": "NRT", "OSA": "KIX", "SEL": "ICN",
}


def _resolve_iata(code: str) -> str:
    return _CITY_TO_AIRPORT.get(code, code)


def google_flights_url(origin: str, destination: str, outbound_date: str, return_date: str) -> str:
    dep = _resolve_iata(origin)
    arr = _resolve_iata(destination)
    return (
        f"https://www.google.com/flights#flt="
        f"{dep}.{arr}.{outbound_date}*{arr}.{dep}.{return_date}"
        f";c:SGD;e:1;s:0*1;sd:1;t:f"
    )


def skyscanner_url(origin: str, destination: str, outbound_date: str, return_date: str) -> str:
    dep = _resolve_iata(origin).lower()
    arr = _resolve_iata(destination).lower()
    out = outbound_date.replace("-", "")[2:]
    ret = return_date.replace("-", "")[2:]
    return f"https://www.skyscanner.com.sg/transport/flights/{dep}/{arr}/{out}/{ret}/"


def google_flights_url_nonstop(origin: str, destination: str, outbound_date: str, return_date: str) -> str:
    dep = _resolve_iata(origin)
    arr = _resolve_iata(destination)
    return (
        f"https://www.google.com/flights#flt="
        f"{dep}.{arr}.{outbound_date}*{arr}.{dep}.{return_date}"
        f";c:SGD;e:1;s:0*0;sd:1;t:f"
    )


def skyscanner_url_nonstop(origin: str, destination: str, outbound_date: str, return_date: str) -> str:
    dep = _resolve_iata(origin).lower()
    arr = _resolve_iata(destination).lower()
    out = outbound_date.replace("-", "")[2:]
    ret = return_date.replace("-", "")[2:]
    return f"https://www.skyscanner.com.sg/transport/flights/{dep}/{arr}/{out}/{ret}/?stops=!2,!1"
