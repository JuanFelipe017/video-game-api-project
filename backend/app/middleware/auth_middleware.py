# Middleware para verificar autenticación de usuarios en endpoints protegidos.
from fastapi import Header, HTTPException
from app.config.database import get_connection

# Middleware — verifica que el user_id del header existe en la BD.
def verify_user(x_user_id: int = Header(None)):
    """
    Middleware simple — verifica que el user_id del header existe en la BD.
    Uso: agregar como dependencia en los endpoints protegidos.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE id = %s", (x_user_id,))
            user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no válido")
        return x_user_id
    finally:
        conn.close()