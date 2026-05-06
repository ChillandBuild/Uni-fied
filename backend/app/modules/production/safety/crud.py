from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.production.safety.schemas import SafetyChecklistCreate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_checklist(conn: MySQLConnection, data: SafetyChecklistCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_saf_create", [
        data.checklist_id, data.batch_number, data.checklist_date,
        data.filling_station, data.supervisor_name,
        data.equipment_condition, data.safety_valves,
        data.fire_safety, data.ppe_compliance, data.status,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_checklist(conn: MySQLConnection, checklist_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM safety_checklists WHERE checklist_id = %s", (checklist_id,)
    )
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    cursor.close()
    return dict(zip(cols, row)) if row else None


def list_checklists(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_saf_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
