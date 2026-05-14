from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.production.gas_production.schemas import GasProductionCreate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_production(conn: MySQLConnection, data: GasProductionCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gprod_create", [
        data.production_id, data.prod_date, data.plant_location,
        data.gas_type, data.shift, data.machine_unit, data.operator_name,
        data.quantity_produced, data.quantity_unit,
        data.purity_level, data.pressure_level,
        data.linked_tank_id, data.remarks,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_production(conn: MySQLConnection, production_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM gas_production WHERE production_id = %s", (production_id,)
    )
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    cursor.close()
    return dict(zip(cols, row)) if row else None


def list_productions(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gprod_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def update_production(conn: MySQLConnection, production_id: str, data) -> Optional[Dict]:
    """Update a gas production entry — only allowed when status is 'draft'."""
    existing = get_production(conn, production_id)
    if not existing:
        return None
    if existing.get("approval_status") == "Posted":
        raise ValueError("Posted entries cannot be edited")

    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE gas_production SET
            prod_date = %s, plant_location = %s, gas_type = %s,
            shift = %s, machine_unit = %s, operator_name = %s,
            quantity_produced = %s, quantity_unit = %s,
            purity_level = %s, pressure_level = %s,
            linked_tank_id = %s, remarks = %s
        WHERE production_id = %s
        """,
        (
            data.prod_date or existing["prod_date"],
            data.plant_location or existing["plant_location"],
            data.gas_type or existing["gas_type"],
            data.shift or existing["shift"],
            data.machine_unit or existing["machine_unit"],
            data.operator_name or existing["operator_name"],
            data.quantity_produced if data.quantity_produced is not None else existing["quantity_produced"],
            data.quantity_unit or existing["quantity_unit"],
            data.purity_level if data.purity_level is not None else existing["purity_level"],
            data.pressure_level if data.pressure_level is not None else existing["pressure_level"],
            data.linked_tank_id if data.linked_tank_id is not None else existing["linked_tank_id"],
            data.remarks if data.remarks is not None else existing["remarks"],
            production_id,
        ),
    )
    conn.commit()
    cursor.close()
    return get_production(conn, production_id)


def update_status(conn: MySQLConnection, production_id: str, status: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gprod_update_status", [production_id, status])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

