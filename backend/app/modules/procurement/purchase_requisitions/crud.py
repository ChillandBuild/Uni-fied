from mysql.connector.connection import MySQLConnection
from app.modules.procurement.purchase_requisitions.schemas import PRCreate, PRItemCreate


def _row(cursor) -> dict | None:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> list[dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_pr(conn: MySQLConnection, data: PRCreate) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_pr_create", [
        data.pr_number, data.pr_date, data.requested_by,
        data.department, data.required_date, data.remarks
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def add_pr_item(conn: MySQLConnection, pr_number: str, data: PRItemCreate) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_pr_add_item", [
        pr_number, data.item_code, data.item_name,
        data.quantity_required, data.uom, data.remarks
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_pr(conn: MySQLConnection, pr_number: str) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_pr_get", [pr_number])
    header = None
    items = []
    
    # First result set is header
    results = list(cursor.stored_results())
    if len(results) > 0:
        header = _row(results[0])
    
    # Second result set is line items
    if len(results) > 1:
        items = _rows(results[1])
        
    cursor.close()
    
    if header:
        header["items"] = items
    return header


def list_prs(conn: MySQLConnection) -> list[dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_pr_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def update_pr_status(conn: MySQLConnection, pr_number: str, status: str) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_pr_update_status", [pr_number, status])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row
