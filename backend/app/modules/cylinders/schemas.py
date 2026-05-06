from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class CylinderCreate(BaseModel):
    serial_number: str
    barcode: Optional[str] = None
    cylinder_type: str
    capacity: float
    capacity_unit: str = "Kg"
    manufacturing_date: Optional[date] = None
    test_due_date: Optional[date] = None
    ownership: str = "Company"
    purchase_id: Optional[str] = None


class CylinderUpdate(BaseModel):
    status: Optional[str] = None
    barcode: Optional[str] = None
    test_due_date: Optional[date] = None
    ownership: Optional[str] = None


class CylinderOut(BaseModel):
    serial_number: str
    barcode: Optional[str]
    cylinder_type: str
    capacity: float
    capacity_unit: str
    manufacturing_date: Optional[date]
    test_due_date: Optional[date]
    ownership: str
    status: str
    purchase_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
