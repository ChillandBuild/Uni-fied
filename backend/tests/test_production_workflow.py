"""
Smoke tests for Tasks 14 & 15: gas production, safety checklists, batches, batch items.
"""
import pytest
from app.modules.production.gas_production import crud as gprod_crud
from app.modules.production.gas_production.schemas import GasProductionCreate
from app.modules.production.safety import crud as saf_crud
from app.modules.production.safety.schemas import SafetyChecklistCreate
from app.modules.production.batches import crud as bat_crud
from app.modules.production.batches.schemas import BatchCreate, BatchItemAdd, BatchItemUpdate
from app.modules.cylinders import crud as cyl_crud
from app.modules.cylinders.schemas import CylinderCreate


def test_gas_production_create_and_get(db):
    data = GasProductionCreate(
        production_id="PROD-001",
        prod_date="2026-05-06",
        plant_location="Plant A",
        gas_type="Oxygen",
        shift="Morning",
        machine_unit="Unit-1",
        operator_name="John Doe",
        quantity_produced=500.0,
        quantity_unit="Kg",
        purity_level=99.5,
        pressure_level=150.0,
    )
    created = gprod_crud.create_production(db, data)
    assert created is not None
    assert created["production_id"] == "PROD-001"
    assert created["operator_name"] == "John Doe"

    fetched = gprod_crud.get_production(db, "PROD-001")
    assert fetched is not None
    assert fetched["quantity_produced"] == 500.0


def test_gas_production_list(db):
    gprod_crud.create_production(db, GasProductionCreate(
        production_id="PROD-L01",
        prod_date="2026-05-06",
        plant_location="Plant B",
        gas_type="Nitrogen",
        shift="Afternoon",
        machine_unit="Unit-2",
        operator_name="Jane Smith",
        quantity_produced=300.0,
    ))
    rows = gprod_crud.list_productions(db)
    ids = [r["production_id"] for r in rows]
    assert "PROD-L01" in ids


def test_gas_production_status_update(db):
    gprod_crud.create_production(db, GasProductionCreate(
        production_id="PROD-S01",
        prod_date="2026-05-06",
        plant_location="Plant A",
        gas_type="CO2",
        shift="Night",
        machine_unit="Unit-3",
        operator_name="Operator X",
        quantity_produced=100.0,
    ))
    updated = gprod_crud.update_status(db, "PROD-S01", "Approved")
    assert updated is not None
    assert updated["approval_status"] == "Approved"


def test_safety_checklist_create_and_get(db):
    data = SafetyChecklistCreate(
        checklist_id="SAF-001",
        checklist_date="2026-05-06",
        filling_station="Station A",
        supervisor_name="Supervisor One",
        equipment_condition="OK",
        safety_valves="OK",
        fire_safety="OK",
        ppe_compliance="OK",
        status="Passed",
    )
    created = saf_crud.create_checklist(db, data)
    assert created is not None
    assert created["checklist_id"] == "SAF-001"
    assert created["status"] == "Passed"

    fetched = saf_crud.get_checklist(db, "SAF-001")
    assert fetched is not None
    assert fetched["supervisor_name"] == "Supervisor One"


def test_safety_checklist_list(db):
    saf_crud.create_checklist(db, SafetyChecklistCreate(
        checklist_id="SAF-L01",
        checklist_date="2026-05-06",
        filling_station="Station B",
        supervisor_name="Supervisor Two",
    ))
    rows = saf_crud.list_checklists(db)
    ids = [r["checklist_id"] for r in rows]
    assert "SAF-L01" in ids


def test_batch_create_and_get_with_items(db):
    # Create a cylinder to use as a batch item
    cyl_crud.create_cylinder(db, CylinderCreate(
        serial_number="CYL-BAT-001",
        cylinder_type="Type A - 47L",
        capacity=47.0,
    ))

    # Create batch
    batch = bat_crud.create_batch(db, BatchCreate(
        batch_number="BAT-001",
        product_type="Oxygen",
        batch_date="2026-05-06",
        gas_type="Oxygen",
        filling_station="Station A",
        operator_name="Filler One",
        shift="Morning",
    ))
    assert batch is not None
    assert batch["batch_number"] == "BAT-001"

    # Add item
    item = bat_crud.add_batch_item(db, "BAT-001", BatchItemAdd(serial_number="CYL-BAT-001"))
    assert item is not None
    assert item["serial_number"] == "CYL-BAT-001"

    # Update item
    updated = bat_crud.update_batch_item(db, "BAT-001", "CYL-BAT-001", BatchItemUpdate(
        input_value=0.0,
        output_value=47.0,
        net_output=47.0,
        item_status="Filled",
        process_status="Complete",
        gas_purity=99.5,
    ))
    assert updated is not None
    assert updated["item_status"] == "Filled"

    # Get batch with items
    detail = bat_crud.get_batch_with_items(db, "BAT-001")
    assert detail is not None
    assert detail["batch_number"] == "BAT-001"
    assert len(detail["items"]) == 1
    assert detail["items"][0]["serial_number"] == "CYL-BAT-001"


def test_batch_status_update(db):
    bat_crud.create_batch(db, BatchCreate(
        batch_number="BAT-S01",
        product_type="Nitrogen",
        shift="Night",
    ))
    updated = bat_crud.update_batch_status(db, "BAT-S01", "Completed")
    assert updated is not None
    assert updated["status"] == "Completed"


def test_batch_list(db):
    bat_crud.create_batch(db, BatchCreate(
        batch_number="BAT-L01",
        product_type="LPG",
    ))
    rows = bat_crud.list_batches(db)
    nums = [r["batch_number"] for r in rows]
    assert "BAT-L01" in nums
