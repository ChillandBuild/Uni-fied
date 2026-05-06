from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.gas_procurement.schemas import GasProcurementCreate

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def create_procurement(conn: MySQLConnection, data: GasProcurementCreate) -> Optional[Dict]:
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
