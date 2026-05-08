import threading
import mysql.connector
from mysql.connector import Error, pooling
from app.core.config import settings

# Pool is lazily initialized on first use (after init_database has created the DB).
# A threading lock prevents the pool from being created twice under concurrent access.
_pool = None
_pool_lock = threading.Lock()


def _ensure_pool():
    """Create the connection pool if it doesn't exist yet."""
    global _pool
    if _pool is not None:
        return
    with _pool_lock:
        if _pool is not None:
            return
        _pool = pooling.MySQLConnectionPool(
            pool_name="sogfusion_pool",
            pool_size=5,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            autocommit=False,
        )


def get_connection():
    """Get a pooled connection. Used by FastAPI route handlers in production."""
    _ensure_pool()
    return _pool.get_connection()


def get_raw_connection(db_name: str | None = None):
    """Get a direct non-pooled connection. Used by init_database() and tests."""
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=db_name,
        autocommit=False,
    )


def _exec_sql_file(cursor, path: str) -> None:
    """
    Execute all statements in a SQL file.
    Statements are separated by ;; (double semicolon).
    This is required because stored procedure bodies contain ; internally,
    so the standard ; delimiter cannot be used as a statement separator.
    Do NOT use ;; inside procedure body text.
    """
    with open(path, "r") as f:
        content = f.read()
    for statement in content.split(";;"):
        stmt = statement.strip()
        if stmt:
            cursor.execute(stmt)


def init_database() -> None:
    """Create the unified database if missing, then run schema.sql and procedures.sql."""
    # Step 1: Create database (connect without selecting a database)
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        autocommit=True,
    )
    try:
        cursor = conn.cursor()
        try:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        finally:
            cursor.close()
    finally:
        conn.close()

    # Step 2: Run schema.sql then procedures.sql
    conn = get_raw_connection(db_name=settings.DB_NAME)
    try:
        cursor = conn.cursor()
        try:
            _exec_sql_file(cursor, "db/schema.sql")
            _exec_sql_file(cursor, "db/procedures.sql")
            
            # Seed lookups table
            cursor.callproc("usp_lkp_seed")
            
            conn.commit()
        finally:
            cursor.close()
    finally:
        conn.close()

    print(f"[SOGFusion] Database '{settings.DB_NAME}' ready.")
