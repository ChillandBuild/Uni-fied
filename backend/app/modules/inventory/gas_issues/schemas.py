from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class GasIssueCreate(BaseModel):
    issue_code: str
    tank_id: str
    issue_date: date
    quantity_issued: float
    issued_to: str
    purpose: Optional[str] = None

class GasIssueOut(BaseModel):
    id: int
    issue_code: str
    tank_id: str
    issue_date: date
    quantity_issued: float
    issued_to: str
    purpose: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
