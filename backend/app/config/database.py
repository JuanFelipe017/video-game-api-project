import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv

load_dotenv()

_pool: pool.SimpleConnectionPool | None = None

class _PoolConnection:
    """Wrapper que redirige .close() a putconn() del pool."""
    def __init__(self, conn, p):
        self._conn = conn
        self._pool = p

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def close(self):
        try:
            self._pool.putconn(self._conn)
        except Exception:
            self._conn.close()

def _get_pool():
    global _pool
    if _pool is None:
        _pool = pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            host=os.getenv("PGHOST"),
            port=os.getenv("PGPORT"),
            user=os.getenv("PGUSER"),
            password=os.getenv("PGPASSWORD"),
            database=os.getenv("PGDATABASE"),
        )
    return _pool

def get_connection():
    try:
        raw = _get_pool().getconn()
        return _PoolConnection(raw, _pool)
    except psycopg2.OperationalError as e:
        raise Exception(f"Error conectando a la base de datos: {e}")
