from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class TrackerCreate(BaseModel):
    serial: str
    location: str
    cylinderStatus: str = Field(alias="cylinderStatus")
    date: date
    status: str = "draft"


class TrackerUpdate(BaseModel):
    serial: Optional[str] = None
    location: Optional[str] = None
    cylinderStatus: Optional[str] = Field(default=None, alias="cylinderStatus")
    date: Optional[date] = None
    status: Optional[str] = None


class TrackerOut(BaseModel):
    id: int
    serial: str
    location: str
    cylinderStatus: str
    date: date
    status: str
    created_at: datetime

    model_config = {"populate_by_name": True}
