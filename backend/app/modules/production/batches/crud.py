from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.production.batches.schemas import BatchCreate, BatchItemAdd, BatchItemUpdate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def create_batch(conn: MySQLConnection, data: BatchCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_bat_create", [
        data.batch_number, data.product_type, data.batch_date,
        data.gas_type, data.filling_station, data.tank_id,
        data.operator_name, data.shift,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def get_batch(conn: MySQLConnection, batch_number: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM batches WHERE batch_number = %s", (batch_number,))
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    cursor.close()
    return dict(zip(cols, row)) if row else None


def get_batch_with_items(conn: MySQLConnection, batch_number: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_bat_get", [batch_number])
    results = list(cursor.stored_results())
    cursor.close()
    if not results:
        return None
    batch_rows = _rows(results[0]) if results else []
    if not batch_rows:
        return None
    batch = batch_rows[0]
    items = _rows(results[1]) if len(results) > 1 else []
    batch["items"] = items
    return batch


def list_batches(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_bat_list")
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows


def update_batch_status(conn: MySQLConnection, batch_number: str, status: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_bat_update_status", [batch_number, status])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def add_batch_item(conn: MySQLConnection, batch_number: str, data: BatchItemAdd) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_bat_add_item", [batch_number, data.serial_number])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row


def update_batch_item(
    conn: MySQLConnection, batch_number: str, serial_number: str, data: BatchItemUpdate
) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_bat_update_item", [
        batch_number, serial_number,
        data.input_value, data.output_value, data.net_output,
        data.indicator, data.item_status, data.process_status,
        data.qc_status, data.gas_purity, data.pressure_check,
        data.leak_test, data.valve_condition, data.remarks,
        data.production_date, data.seal_number, data.seal_type,
        data.sealing_date, data.tag_number, data.expiry_date,
        data.inventory_location,
    ])
    row = None
    for result in cursor.stored_results():
        row = _row(result)
    conn.commit()
    cursor.close()
    return row
