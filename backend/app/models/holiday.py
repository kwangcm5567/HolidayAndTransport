from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False, unique=True)  # YYYY-MM-DD
    day_of_week = Column(String, nullable=False)
    name = Column(String, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    is_observed = Column(Boolean, default=False)
    fetched_at = Column(String, nullable=False)
