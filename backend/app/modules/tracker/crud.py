from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.tracker.schemas import TrackerCreate, TrackerUpdate


POSTED_STATUS = "posted"


def _to_out(row: Optional[Dict]) -> Optional[Dict]:
    if not row:
        return None
    row["_id"] = str(row["id"])
    row["cylinderStatus"] = row.pop("cylinder_status")
    row["date"] = row.pop("entry_date")
    return row


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return _to_out(dict(zip(cols, row))) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [_to_out(dict(zip(cols, row))) for row in cursor.fetchall()]


def list_trackers(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tracker_entries ORDER BY created_at DESC")
    rows = _rows(cursor)
    cursor.close()
    return rows


def get_tracker(conn: MySQLConnection, entry_id: int) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tracker_entries WHERE id = %s", (entry_id,))
    row = _row(cursor)
    cursor.close()
    return row


def create_tracker(conn: MySQLConnection, data: TrackerCreate) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO tracker_entries (serial, location, cylinder_status, entry_date, status)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (data.serial, data.location, data.cylinderStatus, data.date, data.status or "draft"),
    )
    entry_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    return get_tracker(conn, entry_id)


def update_tracker(conn: MySQLConnection, entry_id: int, data: TrackerUpdate) -> Optional[Dict]:
    current = get_tracker(conn, entry_id)
    if not current or current.get("status") == POSTED_STATUS:
        return None

    update = data.model_dump(exclude_unset=True, by_alias=True)
    if not update:
        return current

    mapping = {
        "serial": "serial",
        "location": "location",
        "cylinderStatus": "cylinder_status",
        "date": "entry_date",
        "status": "status",
    }
    fields = [name for name in mapping if name in update]
    values = [update[name] for name in fields]
    values.append(entry_id)

    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE tracker_entries SET {', '.join(f'{mapping[name]} = %s' for name in fields)} WHERE id = %s",
        values,
    )
    conn.commit()
    cursor.close()
    return get_tracker(conn, entry_id)


def post_tracker(conn: MySQLConnection, entry_id: int) -> Optional[Dict]:
    current = get_tracker(conn, entry_id)
    if not current:
        return None
    cursor = conn.cursor()
    cursor.execute("UPDATE tracker_entries SET status = %s WHERE id = %s", (POSTED_STATUS, entry_id))
    conn.commit()
    cursor.close()
    return get_tracker(conn, entry_id)
