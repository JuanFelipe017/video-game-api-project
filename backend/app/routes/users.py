# Rutas relacionadas con usuarios: registro y login.
from fastapi import APIRouter, HTTPException
from app.controllers import users_controller
from app.models.schemas import UserCreate, UserLogin

router = APIRouter()

# Rutas para registro, que llaman a los controladores correspondientes y manejan errores comunes.
@router.post("/register")
def register(data: UserCreate):
    result = users_controller.register(data.dict())
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# Función de login, que verifica credenciales y devuelve el usuario o un error.
@router.post("/login")
def login(data: UserLogin):
    result = users_controller.login(data.dict())
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result