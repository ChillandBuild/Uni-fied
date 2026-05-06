from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel


class CylinderReturnCreate(BaseModel):
    return_id: str
    return_date: date
    customer_name: str
    cylinders: int
    line_items: Optional[Any] = None


class CylinderReturnOut(BaseModel):
    id: int
    return_id: str
    return_date: date
    customer_name: str
    cylinders: int
    line_items: Optional[Any]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
