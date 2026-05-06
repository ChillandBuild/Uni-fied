from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.loss_records.schemas import LossRecordCreate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_loss_record(conn: MySQLConnection, data: LossRecordCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_create", [
        data.loss_code, data.tank_id, data.loss_date,
        data.quantity_lost, data.loss_type, data.notes,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_loss_record(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_get", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_loss_records(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lsr_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
