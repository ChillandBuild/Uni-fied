from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class MonitoringEntryCreate(BaseModel):
    entry_id: str
    tank_id: str
    date: str
    opening_level: float
    quantity_added: float = 0
    quantity_issued: float = 0
    measurement_method: str = "Manual Dip"
    is_posted: int = 0


class MonitoringEntryUpdate(BaseModel):
    date: Optional[str] = None
    opening_level: Optional[float] = None
    quantity_added: Optional[float] = None
    quantity_issued: Optional[float] = None
    measurement_method: Optional[str] = None
    is_posted: Optional[int] = None


class MonitoringEntryOut(BaseModel):
    id: int
    entry_id: str
    tank_id: str
    date: str
    opening_level: float
    quantity_added: float
    quantity_issued: float
    closing_level: float
    measurement_method: str
    is_posted: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TankMonitoringOut(BaseModel):
    tank_id: str
    name: str
    gas_type: str
    capacity_value: float
    capacity_unit: str
    location: str
    current_level: float
    min_level: Optional[float]
    max_level: Optional[float]
    status: str

    model_config = {"from_attributes": True}
