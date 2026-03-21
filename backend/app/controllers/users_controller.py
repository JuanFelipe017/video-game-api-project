# Controlador para manejar las rutas relacionadas con los usuarios (registro y login)
from app.services import auth_service

# Funciones de registro y login, que llaman a los servicios correspondientes y manejan errores comunes. 
def register(data: dict) -> dict:
    user = auth_service.register(
        data["username"],
        data["email"],
        data["password"]
    )
    if not user:
        return {"error": "El email o nombre de usuario ya está en uso"}
    return {"ok": True, "user": user}

# Función de login, que verifica credenciales y devuelve el usuario o un error.
def login(data: dict) -> dict:
    user = auth_service.login(
        data["email"],
        data["password"]
    )
    if not user:
        return {"error": "Email o contraseña incorrectos"}
    return {"ok": True, "user": user}