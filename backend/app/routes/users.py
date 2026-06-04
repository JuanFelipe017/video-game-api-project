from fastapi import APIRouter, HTTPException
from app.controllers import users_controller
from app.models.schemas import UserCreate, UserLogin, TokenOut

router = APIRouter(tags=["auth"])

@router.post("/register", response_model=TokenOut)
def register(data: UserCreate):
    result = users_controller.register(data.dict())
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/login", response_model=TokenOut)
def login(data: UserLogin):
    result = users_controller.login(data.dict())
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result