from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base


class LeaveWindow(Base):
    __tablename__ = "leave_windows"

    id = Column(Integer, primary_key=True, autoincrement=True)
    holiday_id = Column(Integer, ForeignKey("holidays.id"), nullable=False, index=True)
    leave_days_required = Column(Integer, nullable=False)
    window_start = Column(String, nullable=False)  # YYYY-MM-DD
    window_end = Column(String, nullable=False)    # YYYY-MM-DD
    total_days_off = Column(Integer, nullable=False)
    efficiency = Column(Float, nullable=True)
    leave_dates = Column(String, nullable=False)   # JSON array string
    category = Column(String, nullable=False)      # no_leave / take_1_2 / take_3_5
