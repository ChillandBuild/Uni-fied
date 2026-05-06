from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class InvoiceItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity: float
    uom: str = "Nos"
    rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0

class InvoiceItemOut(BaseModel):
    id: int
    invoice_number: str
    item_code: str
    item_name: str
    quantity: float
    uom: str
    rate: float
    tax_amount: float
    total_amount: float

    model_config = {"from_attributes": True}

class InvoiceCreate(BaseModel):
    invoice_number: str
    invoice_date: date
    po_number: Optional[str] = None
    vendor_id: int
    vendor_name: str
    total_amount: float = 0.0

class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    invoice_date: date
    po_number: Optional[str]
    vendor_id: int
    vendor_name: str
    total_amount: float
    status: str
    created_at: datetime
    items: List[InvoiceItemOut] = []

    model_config = {"from_attributes": True}
