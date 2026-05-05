import json
import os
from fastapi import APIRouter
from typing import List

from app.schemas.destination import Destination, PopularDestinationsResponse

router = APIRouter(prefix="/destinations", tags=["destinations"])

_SEED_PATH = os.path.join(os.path.dirname(__file__), "../../data/seeds/destinations.json")


def _load_destinations() -> List[Destination]:
    with open(_SEED_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    return [Destination(**d) for d in raw]


@router.get("/popular", response_model=PopularDestinationsResponse)
def get_popular_destinations():
    destinations = _load_destinations()
    return PopularDestinationsResponse(
        short_trips=[d for d in destinations if d.category == "short_trip"],
        regional=[d for d in destinations if d.category == "regional"],
        long_haul=[d for d in destinations if d.category == "long_haul"],
    )


@router.get("", response_model=List[Destination])
def get_all_destinations():
    return _load_destinations()
