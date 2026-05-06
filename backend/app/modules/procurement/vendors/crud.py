from mysql.connector.connection import MySQLConnection
from app.modules.procurement.vendors.schemas import VendorCreate, VendorUpdate


def _row(cursor) -> dict | None:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> list[dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_vendor(conn: MySQLConnection, data: VendorCreate) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_vnd_create", [
        data.vendor_code, data.vendor_name, data.contact_person,
        data.phone, data.email, data.address, data.payment_terms
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_vendor(conn: MySQLConnection, vendor_id: int) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_vnd_get", [vendor_id])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_vendors(conn: MySQLConnection, active_only: bool = False) -> list[dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_vnd_list", [1 if active_only else 0])
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def update_vendor(conn: MySQLConnection, vendor_id: int, data: VendorUpdate) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_vnd_update", [
        vendor_id, data.vendor_name, data.contact_person, data.phone, data.email,
        data.address, data.payment_terms, 1 if data.is_active else (0 if data.is_active is False else None)
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row
