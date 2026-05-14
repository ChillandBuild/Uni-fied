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
from app.modules.inventory.gas_procurement.schemas import GasProcurementCreate, GasProcurementUpdate
from app.modules.inventory.gas_issues import crud as gis_crud
from app.modules.inventory.gas_issues.schemas import GasIssueCreate, GasIssueUpdate
from app.modules.inventory.loss_records import crud as lsr_crud
from app.modules.inventory.loss_records.schemas import LossRecordCreate, LossRecordUpdate
from app.modules.inventory.tank_inventory_transactions import crud as tit_crud

TANK_ID = "TNK-GI-M01"
BATCH_1 = "BATCH-001"
BATCH_2 = "BATCH-002"


def _raw_conn():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME_TEST,
        autocommit=True,
    )


def _tank_level(conn, tank_id):
    cursor = conn.cursor()
    cursor.execute("SELECT current_level FROM tanks WHERE tank_id = %s", (tank_id,))
    row = cursor.fetchone()
    cursor.close()
    return float(row[0]) if row else None


def _transactions_for_source(conn, source_type, source_code):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM tank_inventory_transactions WHERE source_type = %s AND source_code = %s",
        (source_type, source_code),
    )
    rows = cursor.fetchall()
    cursor.close()
    return rows


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
    cursor.execute(
        "INSERT IGNORE INTO batches (batch_number, product_type, status, batch_date, gas_type, filling_station, tank_id, operator_name, shift) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s), "
        "(%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (
            BATCH_1, "Medical", "Pending", str(date.today()), "Oxygen", "Filling Station 1", TANK_ID, "Operator 1", "Day",
            BATCH_2, "Medical", "Pending", str(date.today()), "Oxygen", "Filling Station 2", TANK_ID, "Operator 2", "Night",
        ),
    )
    cursor.close()
    conn.close()
    yield TANK_ID
    conn = _raw_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM gas_procurements WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM gas_issues WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM loss_records WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM tank_inventory_transactions WHERE tank_id = %s", (TANK_ID,))
    cursor.execute("DELETE FROM batches WHERE batch_number IN (%s, %s)", (BATCH_1, BATCH_2))
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
        gas_type="Oxygen",
        quantity_received=200.0,
        tank_id=TANK_ID,
    ))
    rows = gpr_crud.list_procurements(db)
    codes = [r["procurement_code"] for r in rows]
    assert "GPR-L01" in codes
    assert gpr_crud.get_next_procurement_code(db).startswith("GPR-")


def test_gas_issue_create_and_get(db):
    data = GasIssueCreate(
        issue_code="GIS-001",
        tank_id=TANK_ID,
        issue_date=date.today(),
        quantity_issued=100.0,
        filling_batch_id=BATCH_1,
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
        filling_batch_id=BATCH_1,
        issued_to="Lab",
    ))
    rows = gis_crud.list_issues(db)
    codes = [r["issue_code"] for r in rows]
    assert "GIS-L01" in codes
    assert gis_crud.get_next_issue_code(db).startswith("GIS-")


def test_loss_record_create_and_get(db):
    data = LossRecordCreate(
        loss_code="LSR-001",
        tank_id=TANK_ID,
        loss_date=date.today(),
        expected_quantity=100.0,
        actual_quantity=90.0,
        loss_type="Leakage",
        notes="Minor valve leak",
    )
    created = lsr_crud.create_loss_record(db, data)
    assert created is not None
    assert created["loss_code"] == "LSR-001"
    assert created["loss_type"] == "Leakage"
    assert created["quantity_lost"] == 10.0

    fetched = lsr_crud.get_loss_record(db, "LSR-001")
    assert fetched is not None
    assert fetched["quantity_lost"] == 10.0


def test_loss_record_list(db):
    lsr_crud.create_loss_record(db, LossRecordCreate(
        loss_code="LSR-L01",
        tank_id=TANK_ID,
        loss_date=date.today(),
        expected_quantity=50.0,
        actual_quantity=45.0,
        loss_type="Evaporation",
    ))
    rows = lsr_crud.list_loss_records(db)
    codes = [r["loss_code"] for r in rows]
    assert "LSR-L01" in codes
    assert lsr_crud.get_next_loss_code(db).startswith("LSR-")


def test_loss_record_rejects_invalid_reason(db):
    created = lsr_crud.create_loss_record(db, LossRecordCreate(
        loss_code="LSR-BAD01",
        tank_id=TANK_ID,
        loss_date=date.today(),
        expected_quantity=40.0,
        actual_quantity=35.0,
        loss_type="Measurement Error",
    ))
    assert created["error"] == "Invalid loss reason"


def test_gas_procurement_update_and_post_apply_once(db):
    start_level = _tank_level(db, TANK_ID)
    created = gpr_crud.create_procurement(db, GasProcurementCreate(
        procurement_code="GPR-U01",
        vendor_name="AirGas Ltd",
        date=date.today(),
        gas_type="Oxygen",
        quantity_received=300.0,
        tank_id=TANK_ID,
    ))
    assert created["status"] == "draft"
    assert _tank_level(db, TANK_ID) == start_level

    updated = gpr_crud.update_procurement(db, "GPR-U01", GasProcurementUpdate(
        quantity_received=450.0,
        transport_details="Updated truck",
    ))
    assert updated["quantity_received"] == 450.0

    posted = gpr_crud.post_procurement(db, "GPR-U01")
    assert posted["status"] == "posted"
    assert _tank_level(db, TANK_ID) == start_level + 450.0
    transactions = _transactions_for_source(db, "Procurement", "GPR-U01")
    assert len(transactions) == 1
    assert transactions[0]["direction"] == "IN"
    assert transactions[0]["opening_level"] == start_level
    assert transactions[0]["closing_level"] == start_level + 450.0
    listed = tit_crud.list_transactions(db, tank_id=TANK_ID, source_type="Procurement", source_code="GPR-U01", limit=10)
    assert len(listed) == 1
    assert listed[0]["source_code"] == "GPR-U01"
    assert listed[0]["direction"] == "IN"

    repost = gpr_crud.post_procurement(db, "GPR-U01")
    assert repost["error"] == "Procurement already posted"
    assert _tank_level(db, TANK_ID) == start_level + 450.0


def test_gas_issue_draft_update_and_post_apply_once(db):
    start_level = _tank_level(db, TANK_ID)
    created = gis_crud.create_issue(db, GasIssueCreate(
        issue_code="GIS-U01",
        tank_id=TANK_ID,
        issue_date=date.today(),
        quantity_issued=120.0,
        filling_batch_id="BATCH-001",
        issued_to="Batch 001",
        purpose="Cylinder filling",
    ))
    assert created["status"] == "draft"
    assert _tank_level(db, TANK_ID) == start_level

    updated = gis_crud.update_issue(db, "GIS-U01", GasIssueUpdate(
        quantity_issued=150.0,
        filling_batch_id="BATCH-002",
    ))
    assert updated["quantity_issued"] == 150.0
    assert updated["filling_batch_id"] == "BATCH-002"

    posted = gis_crud.post_issue(db, "GIS-U01")
    assert posted["status"] == "posted"
    assert _tank_level(db, TANK_ID) == start_level - 150.0
    transactions = _transactions_for_source(db, "Gas Issue", "GIS-U01")
    assert len(transactions) == 1
    assert transactions[0]["direction"] == "OUT"
    assert transactions[0]["opening_level"] == start_level
    assert transactions[0]["closing_level"] == start_level - 150.0

    repost = gis_crud.post_issue(db, "GIS-U01")
    assert repost["error"] == "Issue already posted"
    assert _tank_level(db, TANK_ID) == start_level - 150.0


def test_loss_record_draft_update_and_post_apply_once(db):
    start_level = _tank_level(db, TANK_ID)
    created = lsr_crud.create_loss_record(db, LossRecordCreate(
        loss_code="LSR-U01",
        tank_id=TANK_ID,
        loss_date=date.today(),
        expected_quantity=500.0,
        actual_quantity=470.0,
        loss_type="Leakage",
        notes="Initial discrepancy",
    ))
    assert created["status"] == "draft"
    assert created["quantity_lost"] == 30.0
    assert _tank_level(db, TANK_ID) == start_level

    updated = lsr_crud.update_loss_record(db, "LSR-U01", LossRecordUpdate(
        expected_quantity=500.0,
        actual_quantity=460.0,
        loss_type="Transfer Loss",
    ))
    assert updated["quantity_lost"] == 40.0
    assert updated["loss_type"] == "Transfer Loss"

    posted = lsr_crud.post_loss_record(db, "LSR-U01")
    assert posted["status"] == "posted"
    assert _tank_level(db, TANK_ID) == start_level - 40.0
    transactions = _transactions_for_source(db, "Loss Record", "LSR-U01")
    assert len(transactions) == 1
    assert transactions[0]["direction"] == "OUT"
    assert transactions[0]["opening_level"] == start_level
    assert transactions[0]["closing_level"] == start_level - 40.0

    repost = lsr_crud.post_loss_record(db, "LSR-U01")
    assert repost["error"] == "Loss record already posted"
    assert _tank_level(db, TANK_ID) == start_level - 40.0
