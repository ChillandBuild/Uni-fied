from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.procurement.purchase_invoices.schemas import InvoiceCreate

def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None

def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def create_invoice(conn: MySQLConnection, data: InvoiceCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_inv_create", [
        data.invoice_number, data.invoice_date, data.po_number,
        data.vendor_id, data.vendor_name, data.total_amount
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row

def get_invoice(conn: MySQLConnection, invoice_number: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_inv_get", [invoice_number])
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

def list_invoices(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_inv_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
