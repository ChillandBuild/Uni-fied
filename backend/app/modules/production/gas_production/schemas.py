from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GasProductionCreate(BaseModel):
    production_id: str
    prod_date: str
    plant_location: str
    gas_type: str
    shift: str
    machine_unit: str
    operator_name: str
    quantity_produced: float
    quantity_unit: str = "Kg"
    purity_level: Optional[float] = None
    pressure_level: Optional[float] = None
    linked_tank_id: Optional[str] = None
    remarks: Optional[str] = None


class GasProductionUpdate(BaseModel):
    prod_date: Optional[str] = None
    plant_location: Optional[str] = None
    gas_type: Optional[str] = None
    shift: Optional[str] = None
    machine_unit: Optional[str] = None
    operator_name: Optional[str] = None
    quantity_produced: Optional[float] = None
    quantity_unit: Optional[str] = None
    purity_level: Optional[float] = None
    pressure_level: Optional[float] = None
    linked_tank_id: Optional[str] = None
    remarks: Optional[str] = None


class GasProductionStatusUpdate(BaseModel):
    approval_status: str


class GasProductionOut(BaseModel):
    id: int
    production_id: str
    prod_date: str
    plant_location: str
    gas_type: str
    shift: str
    machine_unit: str
    operator_name: str
    quantity_produced: float
    quantity_unit: str
    purity_level: Optional[float]
    pressure_level: Optional[float]
    linked_tank_id: Optional[str]
    remarks: Optional[str]
    approval_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
