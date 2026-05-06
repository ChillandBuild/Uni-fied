from mysql.connector.connection import MySQLConnection


def _rows(cursor) -> list[dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def list_lookups(conn: MySQLConnection, category: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.callproc("usp_lkp_list", [category])
    rows = []
    for result in cursor.stored_results():
        rows = _rows(result)
    cursor.close()
    return rows
