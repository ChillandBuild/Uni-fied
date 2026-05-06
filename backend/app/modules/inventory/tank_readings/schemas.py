from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class TankReadingCreate(BaseModel):
    tank_id: str
    entry_date: date
    level_value: float
    level_unit: str = "Liters"
    entry_method: str = "Manual"
    notes: Optional[str] = None

class TankReadingOut(BaseModel):
    id: int
    tank_id: str
    entry_date: date
    level_value: float
    level_unit: str
    entry_method: str
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
