from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.loss_records.schemas import LossRecordCreate, LossRecordUpdate
from app.modules.inventory.tanks import crud as tank_crud


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def _normalize_loss_values(expected_quantity, actual_quantity, quantity_lost):
    if expected_quantity is not None and actual_quantity is not None:
        computed = max((expected_quantity or 0) - (actual_quantity or 0), 0)
        return expected_quantity, actual_quantity, computed
    return expected_quantity, actual_quantity, quantity_lost if quantity_lost is not None else 0


def _is_valid_loss_type(conn: MySQLConnection, loss_type: str) -> bool:
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT 1 FROM lookups WHERE category = %s AND LOWER(value) = LOWER(%s) LIMIT 1",
            ("loss_type", loss_type),
        )
        return cursor.fetchone() is not None
    finally:
        cursor.close()


def _validate_loss_input(
    conn: MySQLConnection,
    tank_id: str,
    expected_quantity,
    actual_quantity,
    loss_type,
):
    tank = tank_crud.get_tank(conn, tank_id)
    if not tank:
        return "Selected tank is not available", None, None, None
    if tank.get("status") and str(tank["status"]).lower() != "active":
        return "Selected tank is not active", None, None, None
    if expected_quantity is None:
        return "Expected quantity is required", None, None, None
    if actual_quantity is None:
        return "Actual quantity is required", None, None, None
    if expected_quantity <= 0:
        return "Expected quantity must be greater than 0", None, None, None
    if actual_quantity < 0:
        return "Actual quantity cannot be negative", None, None, None
    if actual_quantity > expected_quantity:
        return "Actual quantity cannot exceed expected quantity", None, None, None

    _, _, quantity_lost = _normalize_loss_values(expected_quantity, actual_quantity, None)
    normalized_type = loss_type
    if quantity_lost > 0 and not normalized_type:
        return "Reason is required when loss is detected", None, None, None
    if quantity_lost > 0 and normalized_type and not _is_valid_loss_type(conn, normalized_type):
        return "Invalid loss reason", None, None, None
    if quantity_lost == 0:
        normalized_type = None
    return None, expected_quantity, actual_quantity, normalized_type


def create_loss_record(conn: MySQLConnection, data: LossRecordCreate) -> Optional[Dict]:
    validation_error, expected_quantity, actual_quantity, normalized_type = _validate_loss_input(
        conn,
        data.tank_id,
        data.expected_quantity,
        data.actual_quantity,
        data.loss_type,
    )
    if validation_error:
        return {"error": validation_error}

    expected_quantity, actual_quantity, quantity_lost = _normalize_loss_values(
        expected_quantity, actual_quantity, data.quantity_lost
    )
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_create", [
        data.loss_code, data.tank_id, data.loss_date,
        expected_quantity, actual_quantity, quantity_lost, normalized_type, data.notes,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_loss_record(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_get", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_loss_records(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def get_next_loss_code(conn: MySQLConnection) -> str:
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT loss_code
            FROM loss_records
            WHERE loss_code REGEXP '^LSR-[0-9]+$'
            ORDER BY CAST(SUBSTRING_INDEX(loss_code, '-', -1) AS UNSIGNED) DESC
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        next_number = int(str(row[0]).split('-')[-1]) + 1 if row and row[0] else 1
        return f"LSR-{next_number:03d}"
    finally:
        cursor.close()


def update_loss_record(conn: MySQLConnection, code: str, data: LossRecordUpdate) -> Optional[Dict]:
    current = get_loss_record(conn, code)
    if not current:
        return None

    expected_quantity = data.expected_quantity if data.expected_quantity is not None else current.get("expected_quantity")
    actual_quantity = data.actual_quantity if data.actual_quantity is not None else current.get("actual_quantity")
    current_loss_type = data.loss_type if data.loss_type is not None else current.get("loss_type")
    validation_error, expected_quantity, actual_quantity, normalized_type = _validate_loss_input(
        conn,
        data.tank_id if data.tank_id is not None else current["tank_id"],
        expected_quantity,
        actual_quantity,
        current_loss_type,
    )
    if validation_error:
        return {"error": validation_error}

    quantity_input = data.quantity_lost if data.quantity_lost is not None else current.get("quantity_lost")
    expected_quantity, actual_quantity, quantity_lost = _normalize_loss_values(
        expected_quantity, actual_quantity, quantity_input
    )

    cursor = conn.cursor()
    cursor.callproc("usp_lsr_update", [
        code,
        data.tank_id if data.tank_id is not None else current["tank_id"],
        data.loss_date if data.loss_date is not None else current["loss_date"],
        expected_quantity,
        actual_quantity,
        quantity_lost,
        normalized_type,
        data.notes if data.notes is not None else current.get("notes"),
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def post_loss_record(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_post", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def update_status(conn: MySQLConnection, code: str, status: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_update_status", [code, status])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row
