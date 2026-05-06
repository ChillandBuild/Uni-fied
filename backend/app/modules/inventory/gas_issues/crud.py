from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.gas_issues.schemas import GasIssueCreate

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def create_issue(conn: MySQLConnection, data: GasIssueCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gis_create", [
        data.issue_code, data.tank_id, data.issue_date,
        data.quantity_issued, data.issued_to, data.purpose
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def get_issue(conn: MySQLConnection, code: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gis_get", [code])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row

def list_issues(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_gis_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
