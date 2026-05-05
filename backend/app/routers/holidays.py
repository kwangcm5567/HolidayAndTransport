from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.holiday import HolidayResponse
from app.services.singapore_holidays import get_or_sync_holidays, sync_holidays
from app.services.leave_calculator import sync_leave_windows
from app.config import settings

router = APIRouter(prefix="/holidays", tags=["holidays"])


@router.get("/{year}", response_model=List[HolidayResponse])
async def get_holidays(year: int, db: Session = Depends(get_db)):
    holidays = await get_or_sync_holidays(year, db)
    return holidays


@router.post("/{year}/sync", response_model=dict)
async def force_sync_holidays(year: int, db: Session = Depends(get_db)):
    holidays = await sync_holidays(year, db)
    windows = sync_leave_windows(holidays, db)
    return {"synced": len(holidays), "windows_computed": len(windows), "year": year}
