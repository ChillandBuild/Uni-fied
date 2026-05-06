"""
Smoke tests for Task 13: cylinder filling, movement, dispatch, returns.
"""
import pytest
import mysql.connector
from datetime import date
from app.core.config import settings
from app.modules.inventory.cylinder_filling import crud as fil_crud
from app.modules.inventory.cylinder_filling.schemas import CylinderFillingCreate
from app.modules.inventory.cylinder_movement import crud as mov_crud
from app.modules.inventory.cylinder_movement.schemas import CylinderMovementCreate
from app.modules.inventory.dispatch import crud as dis_crud
from app.modules.inventory.dispatch.schemas import DispatchCreate
from app.modules.inventory.cylinder_returns import crud as ret_crud
from app.modules.inventory.cylinder_returns.schemas import CylinderReturnCreate

TANK_ID = "TNK-CYL-M01"


def _raw_conn():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME_TEST,
        autocommit=True,
    )


@pytest.fixture(scope="module", autouse=True)
def shared_tank():
    conn = _raw_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT IGNORE INTO tanks (tank_id, name, gas_type, capacity_value, "
        "capacity_unit, capacity_display, location, current_level) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (TANK_ID, "Cylinder Ops Tank", "LPG", 5000.0, "Liters", "5000 Liters", "Plant B", 5000.0),
    )
    cursor.close()
    conn.close()
    yield TANK_ID
    conn = _raw_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cylinder_filling_entries WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM tanks WHERE tank_id = %s", (TANK_ID,))
    cursor.close()
    conn.close()


def test_cylinder_filling_create_and_get(db):
    data = CylinderFillingCreate(
        batch_id="FIL-001",
        fill_date=date.today(),
        gas_type="LPG",
        tank_id=TANK_ID,
        cylinders=10,
        net_weight=150.0,
        line_items=[{"serial": "CYL-001", "weight": 15.0}],
    )
    created = fil_crud.create_filling(db, data)
    assert created is not None
    assert created["batch_id"] == "FIL-001"
    assert created["cylinders"] == 10

    fetched = fil_crud.get_filling(db, "FIL-001")
    assert fetched is not None
    assert fetched["net_weight"] == 150.0


def test_cylinder_filling_list(db):
    fil_crud.create_filling(db, CylinderFillingCreate(
        batch_id="FIL-L01",
        fill_date=date.today(),
        gas_type="LPG",
        tank_id=TANK_ID,
        cylinders=5,
        net_weight=75.0,
    ))
    rows = fil_crud.list_fillings(db)
    ids = [r["batch_id"] for r in rows]
    assert "FIL-L01" in ids


def test_cylinder_movement_create_and_get(db):
    data = CylinderMovementCreate(
        movement_id="MOV-001",
        move_date=date.today(),
        from_location="Warehouse 1",
        to_location="Plant A",
        movement_type="Internal Transfer",
        cylinders=5,
        line_items=[{"serial": "CYL-002"}],
    )
    created = mov_crud.create_movement(db, data)
    assert created is not None
    assert created["movement_id"] == "MOV-001"
    assert created["cylinders"] == 5

    fetched = mov_crud.get_movement(db, "MOV-001")
    assert fetched is not None
    assert fetched["from_location"] == "Warehouse 1"


def test_cylinder_movement_list(db):
    mov_crud.create_movement(db, CylinderMovementCreate(
        movement_id="MOV-L01",
        move_date=date.today(),
        from_location="Plant A",
        to_location="Warehouse 2",
        movement_type="Internal Transfer",
        cylinders=3,
    ))
    rows = mov_crud.list_movements(db)
    ids = [r["movement_id"] for r in rows]
    assert "MOV-L01" in ids


def test_dispatch_create_and_get(db):
    data = DispatchCreate(
        dispatch_id="DIS-001",
        dispatch_date=date.today(),
        customer_name="Acme Corp",
        delivery_address="123 Main St",
        cylinders=8,
        line_items=[{"serial": "CYL-010", "qty": 8}],
    )
    created = dis_crud.create_dispatch(db, data)
    assert created is not None
    assert created["dispatch_id"] == "DIS-001"
    assert created["customer_name"] == "Acme Corp"

    fetched = dis_crud.get_dispatch(db, "DIS-001")
    assert fetched is not None
    assert fetched["cylinders"] == 8


def test_dispatch_list(db):
    dis_crud.create_dispatch(db, DispatchCreate(
        dispatch_id="DIS-L01",
        dispatch_date=date.today(),
        customer_name="Beta Ltd",
        cylinders=2,
    ))
    rows = dis_crud.list_dispatches(db)
    ids = [r["dispatch_id"] for r in rows]
    assert "DIS-L01" in ids


def test_cylinder_return_create_and_get(db):
    data = CylinderReturnCreate(
        return_id="RET-001",
        return_date=date.today(),
        customer_name="Acme Corp",
        cylinders=4,
        line_items=[{"serial": "CYL-010", "condition": "Good"}],
    )
    created = ret_crud.create_return(db, data)
    assert created is not None
    assert created["return_id"] == "RET-001"
    assert created["customer_name"] == "Acme Corp"

    fetched = ret_crud.get_return(db, "RET-001")
    assert fetched is not None
    assert fetched["cylinders"] == 4


def test_cylinder_return_list(db):
    ret_crud.create_return(db, CylinderReturnCreate(
        return_id="RET-L01",
        return_date=date.today(),
        customer_name="Beta Ltd",
        cylinders=1,
    ))
    rows = ret_crud.list_returns(db)
    ids = [r["return_id"] for r in rows]
    assert "RET-L01" in ids
