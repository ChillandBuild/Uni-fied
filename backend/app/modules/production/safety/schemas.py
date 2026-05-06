from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SafetyChecklistCreate(BaseModel):
    checklist_id: str
    batch_number: Optional[str] = None
    checklist_date: str
    filling_station: str
    supervisor_name: str
    equipment_condition: str = "OK"
    safety_valves: str = "OK"
    fire_safety: str = "OK"
    ppe_compliance: str = "OK"
    status: str = "Passed"


class SafetyChecklistOut(BaseModel):
    id: int
    checklist_id: str
    batch_number: Optional[str]
    checklist_date: str
    filling_station: str
    supervisor_name: str
    equipment_condition: str
    safety_valves: str
    fire_safety: str
    ppe_compliance: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
