from fastapi import Header, HTTPException
from app.config.database import get_connection
from app.services.jwt_service import verify_access_token

def verify_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Se requiere autenticación")

    token = authorization.split(" ", 1)[1]
    payload = verify_access_token(token)

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no válido")
        return user_id
    finally:
        conn.close()
