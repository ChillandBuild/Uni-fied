from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.procurement.rfqs.schemas import RFQCreate

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def create_rfq(conn: MySQLConnection, data: RFQCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_rfq_create", [
        data.rfq_number, data.rfq_date, data.pr_number, data.validity_date
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def get_rfq(conn: MySQLConnection, rfq_number: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_rfq_get", [rfq_number])
    header = None
    items = []
    vendors = []
    
    results = list(cursor.stored_results())
    if len(results) > 0:
        header = _row(results[0])
    if len(results) > 1:
        items = _rows(results[1])
    if len(results) > 2:
        vendors = _rows(results[2])
        
    cursor.close()
    
    if header:
        header["items"] = items
        header["vendors"] = vendors
    return header

def list_rfqs(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_rfq_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
