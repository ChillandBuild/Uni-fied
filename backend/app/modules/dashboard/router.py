from fastapi import APIRouter, Depends
from app.database.db import get_connection

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def _rows(cursor):
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def _row(cursor):
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else {}


@router.get("/stats")
def get_stats(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.callproc("usp_dash_get_stats")
    results = list(cursor.stored_results())
    cursor.close()

    tank_stats = _row(results[0]) if len(results) > 0 else {}
    today_production = _row(results[1]) if len(results) > 1 else {}
    cylinder_stats = _row(results[2]) if len(results) > 2 else {}
    recent_activity = _rows(results[3]) if len(results) > 3 else []

    return {
        "tanks": tank_stats,
        "today_production": today_production,
        "cylinders": cylinder_stats,
        "recent_activity": recent_activity,
    }
