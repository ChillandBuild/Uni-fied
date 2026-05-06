from datetime import date
from typing import Any, Optional
from pydantic import BaseModel


class CylinderMovementCreate(BaseModel):
    movement_id: str
    move_date: date
    from_location: str
    to_location: str
    movement_type: str
    cylinders: int
    line_items: Optional[Any] = None


class CylinderMovementOut(BaseModel):
    id: int
    movement_id: str
    move_date: date
    from_location: str
    to_location: str
    movement_type: str
    cylinders: int
    line_items: Optional[Any]
    is_posted: bool

    model_config = {"from_attributes": True}
