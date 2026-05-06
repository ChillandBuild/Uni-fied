from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class BatchCreate(BaseModel):
    batch_number: str
    product_type: str
    batch_date: Optional[str] = None
    gas_type: Optional[str] = None
    filling_station: Optional[str] = None
    tank_id: Optional[str] = None
    operator_name: Optional[str] = None
    shift: Optional[str] = None


class BatchStatusUpdate(BaseModel):
    status: str


class BatchItemAdd(BaseModel):
    serial_number: str


class BatchItemUpdate(BaseModel):
    input_value: Optional[float] = None
    output_value: Optional[float] = None
    net_output: Optional[float] = None
    indicator: Optional[str] = None
    item_status: Optional[str] = None
    process_status: Optional[str] = None
    qc_status: Optional[str] = None
    gas_purity: Optional[float] = None
    pressure_check: Optional[str] = None
    leak_test: Optional[str] = None
    valve_condition: Optional[str] = None
    remarks: Optional[str] = None
    production_date: Optional[str] = None
    seal_number: Optional[str] = None
    seal_type: Optional[str] = None
    sealing_date: Optional[str] = None
    tag_number: Optional[str] = None
    expiry_date: Optional[str] = None
    inventory_location: Optional[str] = None


class BatchItemOut(BaseModel):
    id: int
    batch_number: str
    serial_number: str
    input_value: float
    output_value: float
    net_output: float
    indicator: str
    item_status: str
    process_status: Optional[str]
    qc_status: Optional[str]
    gas_purity: Optional[float]
    pressure_check: Optional[str]
    leak_test: Optional[str]
    valve_condition: Optional[str]
    remarks: Optional[str]
    production_date: Optional[str]
    seal_number: Optional[str]
    seal_type: Optional[str]
    sealing_date: Optional[str]
    tag_number: Optional[str]
    expiry_date: Optional[str]
    inventory_location: Optional[str]

    model_config = {"from_attributes": True}


class BatchOut(BaseModel):
    batch_number: str
    product_type: str
    status: str
    batch_date: Optional[str]
    gas_type: Optional[str]
    filling_station: Optional[str]
    tank_id: Optional[str]
    operator_name: Optional[str]
    shift: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BatchDetailOut(BatchOut):
    items: List[BatchItemOut] = []
