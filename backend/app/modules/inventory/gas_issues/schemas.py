from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class GasIssueCreate(BaseModel):
    issue_code: str
    tank_id: str
    issue_date: date
    quantity_issued: float
    gas_type: Optional[str] = None
    filling_batch_id: Optional[str] = None
    issued_to: Optional[str] = None
    purpose: Optional[str] = None


class GasIssueUpdate(BaseModel):
    tank_id: Optional[str] = None
    issue_date: Optional[date] = None
    quantity_issued: Optional[float] = None
    gas_type: Optional[str] = None
    filling_batch_id: Optional[str] = None
    issued_to: Optional[str] = None
    purpose: Optional[str] = None


class GasIssueOut(BaseModel):
    id: int
    issue_code: str
    tank_id: str
    gas_type: Optional[str]
    issue_date: date
    quantity_issued: float
    filling_batch_id: Optional[str]
    issued_to: Optional[str]
    purpose: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
