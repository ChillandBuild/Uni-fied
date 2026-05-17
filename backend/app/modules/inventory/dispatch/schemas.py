from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel


class DispatchCreate(BaseModel):
    dispatch_id: str
    dispatch_date: date
    customer_name: str
    vehicle: Optional[str] = None
    driver: Optional[str] = None
    route: Optional[str] = None
    delivery_address: Optional[str] = None
    cylinders: int
    line_items: Optional[Any] = None
    status: str = "Draft"


class DispatchUpdate(BaseModel):
    dispatch_id: Optional[str] = None
    dispatch_date: Optional[date] = None
    customer_name: Optional[str] = None
    vehicle: Optional[str] = None
    driver: Optional[str] = None
    route: Optional[str] = None
    delivery_address: Optional[str] = None
    cylinders: Optional[int] = None
    line_items: Optional[Any] = None
    status: Optional[str] = None


class DispatchOut(BaseModel):
    id: int
    dispatch_id: str
    dispatch_date: date
    customer_name: str
    vehicle: Optional[str] = None
    driver: Optional[str] = None
    route: Optional[str] = None
    delivery_address: Optional[str]
    cylinders: int
    line_items: Optional[Any]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
