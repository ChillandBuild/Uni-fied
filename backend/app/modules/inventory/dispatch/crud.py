import json
from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.dispatch.schemas import DispatchCreate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_dispatch(conn: MySQLConnection, data: DispatchCreate) -> Optional[Dict]:
    items_json = json.dumps(data.line_items) if data.line_items is not None else None
    cursor = conn.cursor()
    cursor.callproc("usp_dis_create", [
        data.dispatch_id, data.dispatch_date, data.customer_name,
        data.delivery_address, data.cylinders, items_json,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_dispatch(conn: MySQLConnection, dispatch_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_dis_get", [dispatch_id])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_dispatches(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_dis_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
