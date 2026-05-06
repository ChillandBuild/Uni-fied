import pytest
from app.modules.cylinders import crud
from app.modules.cylinders.schemas import CylinderCreate, CylinderUpdate


def test_create_and_get_cylinder(db):
    data = CylinderCreate(serial_number="CYL-T001", cylinder_type="Oxygen", capacity=47.0)
    row = crud.create_cylinder(db, data)
    assert row["serial_number"] == "CYL-T001"
    assert row["status"] == "Empty"

    fetched = crud.get_cylinder(db, "CYL-T001")
    assert fetched is not None
    assert fetched["cylinder_type"] == "Oxygen"


def test_list_cylinders(db):
    rows = crud.list_cylinders(db)
    assert isinstance(rows, list)


def test_update_cylinder_status(db):
    crud.create_cylinder(db, CylinderCreate(serial_number="CYL-T002", cylinder_type="Nitrogen", capacity=47.0))
    updated = crud.update_cylinder(db, "CYL-T002", CylinderUpdate(status="Filled"))
    assert updated["status"] == "Filled"


def test_delete_cylinder(db):
    crud.create_cylinder(db, CylinderCreate(serial_number="CYL-T003", cylinder_type="CO2", capacity=10.0))
    result = crud.delete_cylinder(db, "CYL-T003")
    assert result is True
    assert crud.get_cylinder(db, "CYL-T003") is None
