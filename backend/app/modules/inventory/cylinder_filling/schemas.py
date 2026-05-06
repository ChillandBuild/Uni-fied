from datetime import date
from typing import Any, Optional
from pydantic import BaseModel


class CylinderFillingCreate(BaseModel):
    batch_id: str
    fill_date: date
    gas_type: str
    tank_id: str
    cylinders: int
    net_weight: float
    line_items: Optional[Any] = None


class CylinderFillingOut(BaseModel):
    id: int
    batch_id: str
    fill_date: date
    gas_type: str
    tank_id: str
    cylinders: int
    net_weight: float
    line_items: Optional[Any]
    is_posted: bool

    model_config = {"from_attributes": True}
