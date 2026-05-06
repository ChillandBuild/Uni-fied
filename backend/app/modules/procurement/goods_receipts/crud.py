from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.procurement.goods_receipts.schemas import GRNCreate

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def create_grn(conn: MySQLConnection, data: GRNCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_grn_create", [
        data.grn_number, data.po_number, data.vendor_id,
        data.vendor_name, data.receipt_date, data.warehouse_location
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def get_grn(conn: MySQLConnection, grn_number: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_grn_get", [grn_number])
    header = None
    items = []
    
    results = list(cursor.stored_results())
    if len(results) > 0:
        header = _row(results[0])
    if len(results) > 1:
        items = _rows(results[1])
        
    cursor.close()
    
    if header:
        header["items"] = items
    return header

def list_grns(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_grn_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
