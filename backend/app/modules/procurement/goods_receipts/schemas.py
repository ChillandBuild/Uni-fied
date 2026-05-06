from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class GRNItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity_received: float
    uom: str = "Nos"
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None

class GRNItemOut(BaseModel):
    id: int
    grn_number: str
    item_code: str
    item_name: str
    quantity_received: float
    uom: str
    batch_number: Optional[str]
    expiry_date: Optional[date]

    model_config = {"from_attributes": True}

class GRNCreate(BaseModel):
    grn_number: str
    po_number: Optional[str] = None
    vendor_id: Optional[int] = None
    vendor_name: str
    receipt_date: date
    warehouse_location: Optional[str] = None

class GRNOut(BaseModel):
    id: int
    grn_number: str
    po_number: Optional[str]
    vendor_id: Optional[int]
    vendor_name: str
    receipt_date: date
    warehouse_location: Optional[str]
    status: str
    created_at: datetime
    items: List[GRNItemOut] = []

    model_config = {"from_attributes": True}
