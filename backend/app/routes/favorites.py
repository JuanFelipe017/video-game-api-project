from fastapi import APIRouter
from app.controllers import favorites_controller

router = APIRouter()

@router.get("/{user_id}")
def get_favorites(user_id: int):
    return favorites_controller.get_favorites(user_id)

@router.post("/")
def add_favorite(data: dict):
    return favorites_controller.add_favorite(
        data["user_id"],
        data["game_id"]
    )

@router.delete("/{favorite_id}")
def delete_favorite(favorite_id: int):
    favorites_controller.remove_favorite(favorite_id)
    return {"message": "Favorite removed"}