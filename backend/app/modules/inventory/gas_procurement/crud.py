from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.gas_procurement.schemas import GasProcurementCreate, GasProcurementUpdate
from app.modules.inventory.tanks import crud as tank_crud
from datetime import date as dt_date

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def _validate_procurement_input(
    conn: MySQLConnection,
    vendor_name: str,
    entry_date,
    gas_type: str,
    quantity_received: float,
    tank_id: str,
) -> Optional[str]:
    if not vendor_name or not vendor_name.strip():
        return "Vendor is required"
    if entry_date > dt_date.today():
        return "Future dates are not allowed"
    if quantity_received is None or quantity_received <= 0:
        return "Quantity must be greater than 0"

    tank = tank_crud.get_tank(conn, tank_id)
    if not tank:
        return "Selected tank is not available"
    if tank.get("status") and str(tank["status"]).lower() != "active":
        return "Selected tank is not active"
    if tank.get("gas_type") and gas_type and tank["gas_type"] != gas_type:
        return "Selected tank does not match gas type"

    capacity = float(tank.get("capacity_value") or 0)
    current_level = float(tank.get("current_level") or 0)
    available_space = max(capacity - current_level, 0)
    if quantity_received > available_space:
        return "Exceeds available tank capacity"
    return None

def create_procurement(conn: MySQLConnection, data: GasProcurementCreate) -> Optional[Dict]:
    validation_error = _validate_procurement_input(
        conn,
        data.vendor_name,
        data.date,
        data.gas_type,
        data.quantity_received,
        data.tank_id,
    )
    if validation_error:
        return {"error": validation_error}

    cursor = conn.cursor()
    cursor.callproc("usp_gpr_create", [
        data.procurement_code, data.vendor_name, data.date,
        data.gas_type, data.quantity_received, data.tank_id,
        data.transport_details
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def get_procurement(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gpr_get", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row

def list_procurements(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gpr_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def get_next_procurement_code(conn: MySQLConnection) -> str:
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT procurement_code
            FROM gas_procurements
            WHERE procurement_code REGEXP '^GPR-[0-9]+$'
            ORDER BY CAST(SUBSTRING_INDEX(procurement_code, '-', -1) AS UNSIGNED) DESC
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        next_number = int(str(row[0]).split('-')[-1]) + 1 if row and row[0] else 1
        return f"GPR-{next_number:03d}"
    finally:
        cursor.close()


def update_procurement(conn: MySQLConnection, code: str, data: GasProcurementUpdate) -> Optional[Dict]:
    current = get_procurement(conn, code)
    if not current:
        return None

    next_vendor = data.vendor_name if data.vendor_name is not None else current["vendor_name"]
    next_date = data.date if data.date is not None else current["date"]
    next_gas = data.gas_type if data.gas_type is not None else current["gas_type"]
    next_qty = data.quantity_received if data.quantity_received is not None else current["quantity_received"]
    next_tank = data.tank_id if data.tank_id is not None else current["tank_id"]

    validation_error = _validate_procurement_input(
        conn,
        next_vendor,
        next_date,
        next_gas,
        next_qty,
        next_tank,
    )
    if validation_error:
        return {"error": validation_error}

    cursor = conn.cursor()
    cursor.callproc("usp_gpr_update", [
        code,
        next_vendor,
        next_date,
        next_gas,
        next_qty,
        next_tank,
        data.transport_details if data.transport_details is not None else current["transport_details"],
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def post_procurement(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gpr_post", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def update_status(conn: MySQLConnection, code: str, status: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gpr_update_status", [code, status])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row
