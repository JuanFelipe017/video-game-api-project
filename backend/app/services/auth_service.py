# Autenticación de usuarios: registro y login, con hashing de contraseñas usando bcrypt.
import bcrypt
from app.config.database import get_connection

# Servicio de autenticación: registro y login de usuarios, con hashing de contraseñas.
def _hash_password(password: str) -> str:
    """Encripta la contraseña con bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Verifica si la contraseña coincide con el hash.
def _verify_password(plain: str, hashed: str) -> bool:
    """Verifica si la contraseña coincide con el hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# Función de registro, que verifica si el email o username ya existen y devuelve el usuario creado o None.
def register(username: str, email: str, password: str) -> dict | None:
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Verificar si el email o username ya existen
        cur.execute("SELECT id FROM users WHERE email=%s OR username=%s", (email, username))
        if cur.fetchone():
            return None  # Ya existe

        hashed = _hash_password(password)
        cur.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id, username, email",
            (username, email, hashed)
        )
        user = cur.fetchone()
        conn.commit()
        return {"id": user[0], "username": user[1], "email": user[2]}
    finally:
        cur.close()
        conn.close()

# Función de login, que verifica credenciales y devuelve el usuario o None.   
def login(email: str, password: str) -> dict | None:
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, username, email, password FROM users WHERE email=%s", (email,))
        user = cur.fetchone()

        if not user:
            return None  # Email no existe

        if not _verify_password(password, user[3]):
            return None  # Contraseña incorrecta

        return {"id": user[0], "username": user[1], "email": user[2]}
    finally:
        cur.close()
        conn.close()