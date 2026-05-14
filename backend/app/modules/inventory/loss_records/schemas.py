from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class LossRecordCreate(BaseModel):
    loss_code: str
    tank_id: str
    loss_date: date
    expected_quantity: Optional[float] = None
    actual_quantity: Optional[float] = None
    quantity_lost: Optional[float] = None
    loss_type: Optional[str] = None
    notes: Optional[str] = None


class LossRecordUpdate(BaseModel):
    tank_id: Optional[str] = None
    loss_date: Optional[date] = None
    expected_quantity: Optional[float] = None
    actual_quantity: Optional[float] = None
    quantity_lost: Optional[float] = None
    loss_type: Optional[str] = None
    notes: Optional[str] = None


class LossRecordOut(BaseModel):
    id: int
    loss_code: str
    tank_id: str
    loss_date: date
    expected_quantity: Optional[float]
    actual_quantity: Optional[float]
    quantity_lost: float
    loss_type: Optional[str]
    notes: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
