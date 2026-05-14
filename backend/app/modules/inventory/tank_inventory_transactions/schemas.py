from datetime import date, datetime
from pydantic import BaseModel


class TankInventoryTransactionOut(BaseModel):
    id: int
    tank_id: str
    transaction_date: date
    source_type: str
    source_code: str
    direction: str
    quantity: float
    opening_level: float
    closing_level: float
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
