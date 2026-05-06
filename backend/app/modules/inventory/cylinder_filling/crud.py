import json
from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.cylinder_filling.schemas import CylinderFillingCreate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_filling(conn: MySQLConnection, data: CylinderFillingCreate) -> Optional[Dict]:
    items_json = json.dumps(data.line_items) if data.line_items is not None else None
    cursor = conn.cursor()
    cursor.callproc("usp_fil_create", [
        data.batch_id, data.fill_date, data.gas_type,
        data.tank_id, data.cylinders, data.net_weight, items_json,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_filling(conn: MySQLConnection, batch_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_fil_get", [batch_id])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_fillings(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_fil_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
