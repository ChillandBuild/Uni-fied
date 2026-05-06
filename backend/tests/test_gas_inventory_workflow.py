"""
Smoke tests for Task 12: gas procurement, gas issues, loss records.
The shared tank fixture uses module scope with its own connection so it
is created once and cleaned up after all tests in this module.
"""
import pytest
import mysql.connector
from datetime import date
from app.core.config import settings
from app.modules.inventory.gas_procurement import crud as gpr_crud
from app.modules.inventory.gas_procurement.schemas import GasProcurementCreate
from app.modules.inventory.gas_issues import crud as gis_crud
from app.modules.inventory.gas_issues.schemas import GasIssueCreate
from app.modules.inventory.loss_records import crud as lsr_crud
from app.modules.inventory.loss_records.schemas import LossRecordCreate

TANK_ID = "TNK-GI-M01"


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
        (TANK_ID, "Gas Inv Test Tank", "Oxygen", 10000.0, "Liters", "10000 Liters", "Plant A", 5000.0),
    )
    cursor.close()
    conn.close()
    yield TANK_ID
    conn = _raw_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM gas_procurements WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM gas_issues WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM loss_records WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM tanks WHERE tank_id = %s", (TANK_ID,))
    cursor.close()
    conn.close()


def test_gas_procurement_create_and_get(db):
    data = GasProcurementCreate(
        procurement_code="GPR-001",
        vendor_name="AirGas Ltd",
        date=date.today(),
        gas_type="Oxygen",
        quantity_received=500.0,
        tank_id=TANK_ID,
        transport_details="Truck #12",
    )
    created = gpr_crud.create_procurement(db, data)
    assert created is not None
    assert created["procurement_code"] == "GPR-001"
    assert created["quantity_received"] == 500.0

    fetched = gpr_crud.get_procurement(db, "GPR-001")
    assert fetched is not None
    assert fetched["vendor_name"] == "AirGas Ltd"


def test_gas_procurement_list(db):
    gpr_crud.create_procurement(db, GasProcurementCreate(
        procurement_code="GPR-L01",
        vendor_name="Linde",
        date=date.today(),
        gas_type="Nitrogen",
        quantity_received=200.0,
        tank_id=TANK_ID,
    ))
    rows = gpr_crud.list_procurements(db)
    codes = [r["procurement_code"] for r in rows]
    assert "GPR-L01" in codes


def test_gas_issue_create_and_get(db):
    data = GasIssueCreate(
        issue_code="GIS-001",
        tank_id=TANK_ID,
        issue_date=date.today(),
        quantity_issued=100.0,
        issued_to="Production Line 1",
        purpose="Filling cylinders",
    )
    created = gis_crud.create_issue(db, data)
    assert created is not None
    assert created["issue_code"] == "GIS-001"
    assert created["issued_to"] == "Production Line 1"

    fetched = gis_crud.get_issue(db, "GIS-001")
    assert fetched is not None


def test_gas_issue_list(db):
    gis_crud.create_issue(db, GasIssueCreate(
        issue_code="GIS-L01",
        tank_id=TANK_ID,
        issue_date=date.today(),
        quantity_issued=50.0,
        issued_to="Lab",
    ))
    rows = gis_crud.list_issues(db)
    codes = [r["issue_code"] for r in rows]
    assert "GIS-L01" in codes


def test_loss_record_create_and_get(db):
    data = LossRecordCreate(
        loss_code="LSR-001",
        tank_id=TANK_ID,
        loss_date=date.today(),
        quantity_lost=10.0,
        loss_type="Leakage",
        notes="Minor valve leak",
    )
    created = lsr_crud.create_loss_record(db, data)
    assert created is not None
    assert created["loss_code"] == "LSR-001"
    assert created["loss_type"] == "Leakage"

    fetched = lsr_crud.get_loss_record(db, "LSR-001")
    assert fetched is not None
    assert fetched["quantity_lost"] == 10.0


def test_loss_record_list(db):
    lsr_crud.create_loss_record(db, LossRecordCreate(
        loss_code="LSR-L01",
        tank_id=TANK_ID,
        loss_date=date.today(),
        quantity_lost=5.0,
        loss_type="Evaporation",
    ))
    rows = lsr_crud.list_loss_records(db)
    codes = [r["loss_code"] for r in rows]
    assert "LSR-L01" in codes
