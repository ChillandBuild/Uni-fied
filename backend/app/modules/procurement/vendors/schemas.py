from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VendorCreate(BaseModel):
    vendor_code: str
    vendor_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None


class VendorUpdate(BaseModel):
    vendor_code: Optional[str] = None
    vendor_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[bool] = None


class VendorOut(BaseModel):
    id: int
    vendor_code: str
    vendor_name: str
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    payment_terms: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


    model_config = {"from_attributes": True}
