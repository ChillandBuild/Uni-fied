from mysql.connector.connection import MySQLConnection
from typing import List, Dict, Optional
from app.modules.monitoring.schemas import MonitoringEntryCreate, MonitoringEntryUpdate


def _row(cursor) -> Optional[Dict]:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _rows(cursor) -> List[Dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def list_tanks(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tanks ORDER BY tank_id")
    rows = _rows(cursor)
    cursor.close()
    return rows


def list_entries(conn: MySQLConnection) -> List[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM monitoring_entries ORDER BY created_at DESC"
    )
    rows = _rows(cursor)
    cursor.close()
    return rows


def get_entry(conn: MySQLConnection, entry_id: str) -> Optional[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM monitoring_entries WHERE entry_id = %s", (entry_id,)
    )
    row = _row(cursor)
    cursor.close()
    return row


def create_entry(conn: MySQLConnection, data: MonitoringEntryCreate) -> Optional[Dict]:
    closing = data.opening_level + data.quantity_added - data.quantity_issued
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO monitoring_entries
          (entry_id, tank_id, date, opening_level, quantity_added,
           quantity_issued, closing_level, measurement_method, is_posted)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data.entry_id, data.tank_id, data.date,
            data.opening_level, data.quantity_added, data.quantity_issued,
            closing, data.measurement_method, data.is_posted,
        ),
    )
    # Update tank current level
    cursor.execute(
        "UPDATE tanks SET current_level = %s WHERE tank_id = %s",
        (closing, data.tank_id),
    )
    conn.commit()
    cursor.execute(
        "SELECT * FROM monitoring_entries WHERE entry_id = %s", (data.entry_id,)
    )
    row = _row(cursor)
    cursor.close()
    return row


def update_entry(conn: MySQLConnection, entry_id: str, data: MonitoringEntryUpdate) -> Optional[Dict]:
    # Check if entry exists and is not posted
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM monitoring_entries WHERE entry_id = %s", (entry_id,)
    )
    existing = _row(cursor)
    if not existing:
        cursor.close()
        return None

    if existing["is_posted"] == 1:
        cursor.close()
        raise ValueError("Entry is posted and cannot be edited")

    # Merge updates
    opening = data.opening_level if data.opening_level is not None else existing["opening_level"]
    added = data.quantity_added if data.quantity_added is not None else existing["quantity_added"]
    issued = data.quantity_issued if data.quantity_issued is not None else existing["quantity_issued"]
    closing = opening + added - issued
    date = data.date if data.date is not None else str(existing["date"])
    method = data.measurement_method if data.measurement_method is not None else existing["measurement_method"]
    is_posted = data.is_posted if data.is_posted is not None else existing["is_posted"]
    tank_id = existing["tank_id"]

    cursor.execute(
        """
        UPDATE monitoring_entries SET
            date = %s, opening_level = %s, quantity_added = %s,
            quantity_issued = %s, closing_level = %s,
            measurement_method = %s, is_posted = %s
        WHERE entry_id = %s
        """,
        (date, opening, added, issued, closing, method, is_posted, entry_id),
    )
    # Update tank current_level if this is being posted
    if is_posted == 1:
        cursor.execute(
            "UPDATE tanks SET current_level = %s WHERE tank_id = %s",
            (closing, tank_id),
        )
    conn.commit()
    cursor.execute(
        "SELECT * FROM monitoring_entries WHERE entry_id = %s", (entry_id,)
    )
    row = _row(cursor)
    cursor.close()
    return row
