from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.tank_readings.schemas import TankReadingCreate

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def create_reading(conn: MySQLConnection, data: TankReadingCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lvl_create", [
        data.tank_id, data.entry_date, data.level_value,
        data.level_unit, data.entry_method, data.notes
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def list_readings_by_tank(conn: MySQLConnection, tank_id: str) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lvl_list_by_tank", [tank_id])
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
