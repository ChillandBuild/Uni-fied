from typing import Optional
from pydantic import BaseModel


class TankBase(BaseModel):
    tank_id: str
    name: str
    gas_type: str
    capacity_value: float
    capacity_unit: str = "Liters"
    location: str
    min_level: Optional[float] = None
    max_level: Optional[float] = None
    calibration_ref: Optional[str] = None


class TankCreate(TankBase):
    pass


class TankUpdate(BaseModel):
    name: Optional[str] = None
    gas_type: Optional[str] = None
    capacity_value: Optional[float] = None
    capacity_unit: Optional[str] = None
    location: Optional[str] = None
    min_level: Optional[float] = None
    max_level: Optional[float] = None
    calibration_ref: Optional[str] = None
    status: Optional[str] = None


class TankOut(TankBase):
    capacity_display: Optional[str]
    status: str
    current_level: float
    is_posted: int = 0

    model_config = {"from_attributes": True}
