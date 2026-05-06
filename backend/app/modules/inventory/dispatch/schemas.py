from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel


class DispatchCreate(BaseModel):
    dispatch_id: str
    dispatch_date: date
    customer_name: str
    delivery_address: Optional[str] = None
    cylinders: int
    line_items: Optional[Any] = None


class DispatchOut(BaseModel):
    id: int
    dispatch_id: str
    dispatch_date: date
    customer_name: str
    delivery_address: Optional[str]
    cylinders: int
    line_items: Optional[Any]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
