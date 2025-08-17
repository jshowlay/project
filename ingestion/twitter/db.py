import os
import psycopg2
import psycopg2.extras
from contextlib import contextmanager

def get_conn():
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL not set")
    return psycopg2.connect(dsn, cursor_factory=psycopg2.extras.RealDictCursor)

@contextmanager
def db_cursor():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def run_schema(schema_path: str):
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
    with db_cursor() as cur:
        cur.execute(sql)


