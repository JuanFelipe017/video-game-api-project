import bcrypt
from app.config.database import get_connection
from app.services.jwt_service import create_access_token

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def register(username: str, email: str, password: str) -> dict | None:
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM users WHERE email=%s OR username=%s", (email, username))
        if cur.fetchone():
            return None

        hashed = _hash_password(password)
        cur.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id, username, email",
            (username, email, hashed)
        )
        user = cur.fetchone()
        conn.commit()
        user_dict = {"id": user[0], "username": user[1], "email": user[2]}
        token = create_access_token({"user_id": user[0], "username": user[1], "email": user[2]})
        return {"access_token": token, "token_type": "bearer", "user": user_dict}
    finally:
        cur.close()
        conn.close()

def login(email: str, password: str) -> dict | None:
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, username, email, password FROM users WHERE email=%s", (email,))
        user = cur.fetchone()

        if not user:
            return None

        if not _verify_password(password, user[3]):
            return None

        user_dict = {"id": user[0], "username": user[1], "email": user[2]}
        token = create_access_token({"user_id": user[0], "username": user[1], "email": user[2]})
        return {"access_token": token, "token_type": "bearer", "user": user_dict}
    finally:
        cur.close()
        conn.close()
