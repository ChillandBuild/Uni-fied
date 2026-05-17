import json
from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.inventory.cylinder_returns.schemas import CylinderReturnCreate, CylinderReturnUpdate


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


def create_return(conn: MySQLConnection, data: CylinderReturnCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO return_entries
            (return_id, return_date, customer_name, cylinders, line_items, status)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            data.return_id,
            data.return_date,
            data.customer_name,
            data.cylinders,
            _items_json(data.line_items),
            data.status or "Draft",
        ),
    )
    conn.commit()
    cursor.close()
    return get_return(conn, data.return_id)


def get_return(conn: MySQLConnection, return_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM return_entries WHERE return_id = %s", (return_id,))
    row = _row(cursor)
    cursor.close()
    return row


def list_returns(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM return_entries ORDER BY created_at DESC")
    rows = _rows(cursor)
    cursor.close()
    return rows


def update_return(conn: MySQLConnection, return_id: str, data: CylinderReturnUpdate) -> Optional[Dict]:
    current = get_return(conn, return_id)
    if not current or current.get("status") == POSTED_STATUS:
        return None

    update = data.model_dump(exclude_unset=True)
    if not update:
        return current
    if "line_items" in update:
        update["line_items"] = _items_json(update["line_items"])

    allowed = ["return_id", "return_date", "customer_name", "cylinders", "line_items", "status"]
    fields = [name for name in allowed if name in update]
    values = [update[name] for name in fields]
    values.append(return_id)

    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE return_entries SET {', '.join(f'{name} = %s' for name in fields)} WHERE return_id = %s",
        values,
    )
    conn.commit()
    cursor.close()
    return get_return(conn, return_id)


def post_return(conn: MySQLConnection, return_id: str) -> Optional[Dict]:
    current = get_return(conn, return_id)
    if not current:
        return None
    cursor = conn.cursor()
    cursor.execute("UPDATE return_entries SET status = %s WHERE return_id = %s", (POSTED_STATUS, return_id))
    conn.commit()
    cursor.close()
    return get_return(conn, return_id)
