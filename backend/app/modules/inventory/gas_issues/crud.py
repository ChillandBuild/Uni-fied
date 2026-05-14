from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.gas_issues.schemas import GasIssueCreate, GasIssueUpdate
from app.modules.inventory.tanks import crud as tank_crud
from app.modules.production.batches import crud as batch_crud

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def _validate_issue_input(
    conn: MySQLConnection,
    tank_id: str,
    quantity_issued: float,
    filling_batch_id: Optional[str],
    gas_type: Optional[str] = None,
) -> Optional[str]:
    if quantity_issued is None or quantity_issued <= 0:
        return "Quantity must be greater than 0"
    if not filling_batch_id:
        return "Filling batch is required"

    tank = tank_crud.get_tank(conn, tank_id)
    if not tank:
        return "Selected tank is not available"
    if tank.get("status") and str(tank["status"]).lower() != "active":
        return "Selected tank is not active"

    tank_gas = tank.get("gas_type")
    if gas_type and tank_gas and gas_type != tank_gas:
        return "Selected tank does not match gas type"

    batch = batch_crud.get_batch(conn, filling_batch_id)
    if not batch:
        return "Linked filling batch was not found"
    if batch.get("status") == "Rejected":
        return "Rejected batches cannot be linked"
    if batch.get("gas_type") and tank_gas and batch["gas_type"] != tank_gas:
        return "Linked filling batch does not match tank gas type"

    current_level = float(tank.get("current_level") or 0)
    if quantity_issued > current_level:
        return "Insufficient gas in tank"
    return None

def create_issue(conn: MySQLConnection, data: GasIssueCreate) -> Optional[Dict]:
    validation_error = _validate_issue_input(
        conn,
        data.tank_id,
        data.quantity_issued,
        data.filling_batch_id,
        data.gas_type,
    )
    if validation_error:
        return {"error": validation_error}

    cursor = conn.cursor()
    cursor.callproc("usp_gis_create", [
        data.issue_code, data.tank_id, data.issue_date,
        data.quantity_issued, data.filling_batch_id, data.issued_to, data.purpose
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def get_issue(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gis_get", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row

def list_issues(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gis_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def get_next_issue_code(conn: MySQLConnection) -> str:
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT issue_code
            FROM gas_issues
            WHERE issue_code REGEXP '^GIS-[0-9]+$'
            ORDER BY CAST(SUBSTRING_INDEX(issue_code, '-', -1) AS UNSIGNED) DESC
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        next_number = int(str(row[0]).split('-')[-1]) + 1 if row and row[0] else 1
        return f"GIS-{next_number:03d}"
    finally:
        cursor.close()


def update_issue(conn: MySQLConnection, code: str, data: GasIssueUpdate) -> Optional[Dict]:
    current = get_issue(conn, code)
    if not current:
        return None

    next_tank = data.tank_id if data.tank_id is not None else current["tank_id"]
    next_qty = data.quantity_issued if data.quantity_issued is not None else current["quantity_issued"]
    next_batch = data.filling_batch_id if data.filling_batch_id is not None else current.get("filling_batch_id")
    next_gas = data.gas_type if data.gas_type is not None else current.get("gas_type")

    validation_error = _validate_issue_input(
        conn,
        next_tank,
        next_qty,
        next_batch,
        next_gas,
    )
    if validation_error:
        return {"error": validation_error}

    cursor = conn.cursor()
    cursor.callproc("usp_gis_update", [
        code,
        next_tank,
        data.issue_date if data.issue_date is not None else current["issue_date"],
        next_qty,
        next_batch,
        data.issued_to if data.issued_to is not None else current.get("issued_to"),
        data.purpose if data.purpose is not None else current.get("purpose"),
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def post_issue(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_iss_post", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def update_status(conn: MySQLConnection, code: str, status: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_iss_update_status", [code, status])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row
