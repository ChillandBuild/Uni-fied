from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class LossRecordCreate(BaseModel):
    loss_code: str
    tank_id: str
    loss_date: date
    quantity_lost: float
    loss_type: str
    notes: Optional[str] = None


class LossRecordOut(BaseModel):
    id: int
    loss_code: str
    tank_id: str
    loss_date: date
    quantity_lost: float
    loss_type: str
    notes: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
