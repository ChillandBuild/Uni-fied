from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class PRItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity_required: float
    uom: str = "Nos"
    remarks: Optional[str] = None


class PRItemOut(BaseModel):
    id: int
    pr_number: str
    item_code: str
    item_name: str
    quantity_required: float
    uom: str
    remarks: Optional[str]

    model_config = {"from_attributes": True}


class PRCreate(BaseModel):
    pr_number: str
    pr_date: date
    requested_by: str
    department: str
    required_date: date
    remarks: Optional[str] = None


class PRUpdateStatus(BaseModel):
    status: str


class PROut(BaseModel):
    id: int
    pr_number: str
    pr_date: date
    requested_by: str
    department: str
    required_date: date
    status: str
    remarks: Optional[str]
    created_at: datetime
    items: list[PRItemOut] = []

    model_config = {"from_attributes": True}
