from fastapi import APIRouter
from app.controllers import users_controller

router = APIRouter()

@router.post("/register")
def register(data: dict):
    return users_controller.register(data)

@router.post("/login")
def login(data: dict):
    return users_controller.login(data)