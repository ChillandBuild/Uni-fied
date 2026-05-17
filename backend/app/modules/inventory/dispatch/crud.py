import json
from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.dispatch.schemas import DispatchCreate, DispatchUpdate


POSTED_STATUS = "Posted"


def _decode_line_items(row: Optional[Dict]) -> Optional[Dict]:
    if row and isinstance(row.get("line_items"), str):
        try:
            row["line_items"] = json.loads(row["line_items"])
        except json.JSONDecodeError:
            pass
    return row


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return _decode_line_items(dict(zip(cols, row))) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [_decode_line_items(dict(zip(cols, row))) for row in cursor.fetchall()]


def _items_json(value):
    return json.dumps(value) if value is not None else None


def create_dispatch(conn: MySQLConnection, data: DispatchCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO dispatch_entries
            (dispatch_id, dispatch_date, customer_name, vehicle, driver, route, delivery_address, cylinders, line_items, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data.dispatch_id,
            data.dispatch_date,
            data.customer_name,
            data.vehicle,
            data.driver,
            data.route,
            data.delivery_address,
            data.cylinders,
            _items_json(data.line_items),
            data.status or "Draft",
        ),
    )
    conn.commit()
    cursor.close()
    return get_dispatch(conn, data.dispatch_id)


def get_dispatch(conn: MySQLConnection, dispatch_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dispatch_entries WHERE dispatch_id = %s", (dispatch_id,))
    row = _row(cursor)
    cursor.close()
    return row


def list_dispatches(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dispatch_entries ORDER BY created_at DESC")
    rows = _rows(cursor)
    cursor.close()
    return rows


def update_dispatch(conn: MySQLConnection, dispatch_id: str, data: DispatchUpdate) -> Optional[Dict]:
    current = get_dispatch(conn, dispatch_id)
    if not current or current.get("status") == POSTED_STATUS:
        return None

    update = data.model_dump(exclude_unset=True)
    if not update:
        return current
    if "line_items" in update:
        update["line_items"] = _items_json(update["line_items"])

    allowed = [
        "dispatch_id",
        "dispatch_date",
        "customer_name",
        "vehicle",
        "driver",
        "route",
        "delivery_address",
        "cylinders",
        "line_items",
        "status",
    ]
    fields = [name for name in allowed if name in update]
    values = [update[name] for name in fields]
    values.append(dispatch_id)

    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE dispatch_entries SET {', '.join(f'{name} = %s' for name in fields)} WHERE dispatch_id = %s",
        values,
    )
    conn.commit()
    cursor.close()
    return get_dispatch(conn, dispatch_id)


def post_dispatch(conn: MySQLConnection, dispatch_id: str) -> Optional[Dict]:
    current = get_dispatch(conn, dispatch_id)
    if not current:
        return None
    cursor = conn.cursor()
    cursor.execute("UPDATE dispatch_entries SET status = %s WHERE dispatch_id = %s", (POSTED_STATUS, dispatch_id))
    conn.commit()
    cursor.close()
    return get_dispatch(conn, dispatch_id)
