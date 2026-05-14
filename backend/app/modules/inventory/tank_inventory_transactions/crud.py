from mysql.connector.connection import MySQLConnection
from typing import Dict, List, Optional


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def list_transactions(
    conn: MySQLConnection,
    tank_id: Optional[str] = None,
    source_type: Optional[str] = None,
    source_code: Optional[str] = None,
    limit: int = 20,
) -> List[Dict]:
    cursor = conn.cursor()
    try:
        cursor.callproc(
            "usp_tit_list",
            [tank_id or "", source_type or "", source_code or "", limit],
        )
        rows: List[Dict] = []
        for result in cursor.stored_results():
            rows = _rows(result)
        return rows
    finally:
        cursor.close()
