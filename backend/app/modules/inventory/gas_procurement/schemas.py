from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class GasProcurementCreate(BaseModel):
    procurement_code: str
    vendor_name: str
    date: date
    gas_type: str
    quantity_received: float
    tank_id: str
    transport_details: Optional[str] = None

class GasProcurementOut(BaseModel):
    id: int
    procurement_code: str
    vendor_name: str
    date: date
    gas_type: str
    quantity_received: float
    tank_id: str
    transport_details: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
