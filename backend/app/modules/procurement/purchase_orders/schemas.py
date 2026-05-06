from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class POItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity: float
    uom: str = "Nos"
    rate: float = 0.0
    tax_percent: float = 0.0
    discount_percent: float = 0.0

class POItemOut(BaseModel):
    id: int
    po_number: str
    item_code: str
    item_name: str
    quantity: float
    uom: str
    rate: float
    tax_percent: float
    discount_percent: float
    total_amount: float

    model_config = {"from_attributes": True}

class POCreate(BaseModel):
    po_number: str
    vendor_id: int
    vendor_name: str
    po_date: date
    delivery_date: date
    payment_terms: Optional[str] = None
    currency: str = "INR"
    total_amount: float = 0.0
    rfq_number: Optional[str] = None
    pr_number: Optional[str] = None

class POOut(BaseModel):
    id: int
    po_number: str
    vendor_id: int
    vendor_name: str
    po_date: date
    delivery_date: date
    payment_terms: Optional[str]
    currency: str
    total_amount: float
    approval_status: str
    rfq_number: Optional[str]
    pr_number: Optional[str]
    created_at: datetime
    items: List[POItemOut] = []

    model_config = {"from_attributes": True}
