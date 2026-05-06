import json
from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.cylinder_returns.schemas import CylinderReturnCreate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_return(conn: MySQLConnection, data: CylinderReturnCreate) -> Optional[Dict]:
    items_json = json.dumps(data.line_items) if data.line_items is not None else None
    cursor = conn.cursor()
    cursor.callproc("usp_ret_create", [
        data.return_id, data.return_date, data.customer_name,
        data.cylinders, items_json,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_return(conn: MySQLConnection, return_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_ret_get", [return_id])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_returns(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_ret_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
