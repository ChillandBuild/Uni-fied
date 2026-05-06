from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.tanks.schemas import TankCreate, TankUpdate

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def create_tank(conn: MySQLConnection, data: TankCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_tnk_create", [
        data.tank_id, data.name, data.gas_type,
        data.capacity_value, data.capacity_unit, data.location,
        data.min_level, data.max_level, data.calibration_ref
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def get_tank(conn: MySQLConnection, tank_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_tnk_get", [tank_id])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row

def list_tanks(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_tnk_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows

def update_tank(conn: MySQLConnection, tank_id: str, data: TankUpdate) -> Optional[Dict]:
    cursor = conn.cursor()
    # Fetch current values to handle partial updates if necessary
    # But the procedure usp_tnk_update seems to expect all parameters
    current = get_tank(conn, tank_id)
    if not current:
        return None
    
    cursor.callproc("usp_tnk_update", [
        tank_id,
        data.status if data.status is not None else current["status"],
        current["current_level"], # level is not updated here
        data.name or current["name"],
        data.location or current["location"]
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def delete_tank(conn: MySQLConnection, tank_id: str) -> bool:
    cursor = conn.cursor()
    cursor.callproc("usp_tnk_delete", [tank_id])
    conn.commit()
    cursor.close()
    return True
