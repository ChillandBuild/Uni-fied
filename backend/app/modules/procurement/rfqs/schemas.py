from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class RFQItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity: float
    uom: str = "Nos"
    expected_rate: float = 0.0

class RFQItemOut(BaseModel):
    id: int
    rfq_number: str
    item_code: str
    item_name: str
    quantity: float
    uom: str
    expected_rate: float

    model_config = {"from_attributes": True}

class RFQVendorCreate(BaseModel):
    vendor_id: int

class RFQVendorOut(BaseModel):
    id: int
    rfq_number: str
    vendor_id: int

    model_config = {"from_attributes": True}

class RFQCreate(BaseModel):
    rfq_number: str
    rfq_date: date
    pr_number: Optional[str] = None
    validity_date: date

class RFQOut(BaseModel):
    id: int
    rfq_number: str
    rfq_date: date
    pr_number: Optional[str]
    validity_date: date
    status: str
    created_at: datetime
    items: List[RFQItemOut] = []
    vendors: List[RFQVendorOut] = []

    model_config = {"from_attributes": True}
