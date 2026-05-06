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


def update_status(conn: MySQLConnection, production_id: str, status: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gprod_update_status", [production_id, status])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row
