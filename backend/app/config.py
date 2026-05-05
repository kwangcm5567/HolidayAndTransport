from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    AMADEUS_CLIENT_ID: str = ""
    AMADEUS_CLIENT_SECRET: str = ""
    AMADEUS_ENV: str = "test"  # "test" or "production"

    DB_PATH: str = "./data/holidays.db"
    CACHE_DIR: str = "./data/cache"
    HOLIDAY_CACHE_TTL_HOURS: int = 168  # 7 days
    FLIGHT_CACHE_TTL_HOURS: int = 24
    HOTEL_CACHE_TTL_HOURS: int = 24

    DEFAULT_YEAR: int = 2026
    DEPARTURE_AIRPORT: str = "SIN"
    CURRENCY: str = "SGD"
    MAX_LEAVE_DAYS: int = 5

    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    SG_HOLIDAYS_RESOURCE_ID: str = "d_3751791452397f1b1c80c451447e30d"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
