import json
from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.cylinder_movement.schemas import CylinderMovementCreate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_movement(conn: MySQLConnection, data: CylinderMovementCreate) -> Optional[Dict]:
    items_json = json.dumps(data.line_items) if data.line_items is not None else None
    cursor = conn.cursor()
    cursor.callproc("usp_mov_create", [
        data.movement_id, data.move_date, data.from_location,
        data.to_location, data.movement_type, data.cylinders, items_json,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_movement(conn: MySQLConnection, movement_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_mov_get", [movement_id])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_movements(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_mov_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
