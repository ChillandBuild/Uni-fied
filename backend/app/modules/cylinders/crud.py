from mysql.connector.connection import MySQLConnection
from app.modules.cylinders.schemas import CylinderCreate, CylinderUpdate


def _row(cursor) -> dict | None:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> list[dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_cylinder(conn: MySQLConnection, data: CylinderCreate) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_cyl_create", [
        data.serial_number, data.barcode, data.cylinder_type,
        data.capacity, data.capacity_unit,
        data.manufacturing_date, data.test_due_date,
        data.ownership, data.purchase_id,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_cylinder(conn: MySQLConnection, serial_number: str) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_cyl_get", [serial_number])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    cursor.close()
    return row


def list_cylinders(conn: MySQLConnection, status: str | None = None) -> list[dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_cyl_list", [status or ""])
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def update_cylinder(conn: MySQLConnection, serial_number: str, data: CylinderUpdate) -> dict | None:
    cursor = conn.cursor()
    cursor.callproc("usp_cyl_update", [
        serial_number, data.status, data.barcode,
        data.test_due_date, data.ownership,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def delete_cylinder(conn: MySQLConnection, serial_number: str) -> bool:
    cursor = conn.cursor()
    cursor.callproc("usp_cyl_delete", [serial_number])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row["deleted"] > 0 if row else False
