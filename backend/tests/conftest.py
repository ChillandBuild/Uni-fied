import pytest
import mysql.connector
from app.core.config import settings
from app.database.db import _exec_sql_file


def _get_admin_conn():
    """Connection without database selection — for CREATE/DROP DATABASE."""
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        autocommit=True,
    )


def _get_test_conn():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME_TEST,
        autocommit=False,
    )


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create test DB, run schema + procedures once per test session. Drop after."""
    conn = _get_admin_conn()
    try:
        cursor = conn.cursor()
        try:
            cursor.execute(f"DROP DATABASE IF EXISTS `{settings.DB_NAME_TEST}`")
            cursor.execute(
                f"CREATE DATABASE `{settings.DB_NAME_TEST}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        finally:
            cursor.close()
    finally:
        conn.close()

    conn = _get_test_conn()
    try:
        cursor = conn.cursor()
        try:
            _exec_sql_file(cursor, "db/schema.sql")
            _exec_sql_file(cursor, "db/procedures.sql")
            conn.commit()
        finally:
            cursor.close()
    finally:
        conn.close()

    yield

    conn = _get_admin_conn()
    try:
        cursor = conn.cursor()
        try:
            cursor.execute(f"DROP DATABASE IF EXISTS `{settings.DB_NAME_TEST}`")
        finally:
            cursor.close()
    finally:
        conn.close()


@pytest.fixture
def db():
    """
    Per-test MySQL connection with transaction rollback for isolation.

    ASSUMPTION: All stored procedures called in tests perform DML only (INSERT,
    UPDATE, DELETE) on InnoDB tables and do NOT issue COMMIT, ROLLBACK, START
    TRANSACTION, or any DDL (CREATE, ALTER, TRUNCATE, DROP) internally.
    Procedures that violate this contract will cause state to leak between tests.

    Note: AUTO_INCREMENT counters are NOT reset by rollback — avoid asserting
    on specific ID values in tests.
    """
    conn = _get_test_conn()
    conn.start_transaction()
    try:
        yield conn
    finally:
        conn.rollback()
        conn.close()
