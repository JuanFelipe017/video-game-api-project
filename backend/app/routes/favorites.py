# Rutas para manejar las operaciones relacionadas con los favoritos de los usuarios.
from fastapi import APIRouter, HTTPException, Depends
from app.controllers import favorites_controller
from app.models.schemas import FavoriteCreate
from app.middleware.auth_middleware import verify_user

router = APIRouter() 

# Rutas para obtener favoritos, agregar un favorito y eliminar un favorito, usando el middleware de autenticación.
@router.get("/{user_id}")
def get_favorites(user_id: int, current_user: int = Depends(verify_user)):
    return favorites_controller.get_favorites(user_id)

# Agrega un juego a los favoritos de un usuario, verificando que no esté ya agregado
@router.post("/")
def add_favorite(data: FavoriteCreate, current_user: int = Depends(verify_user)):
    result = favorites_controller.add_favorite(data.user_id, data.game_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# Elimina un favorito por su ID, devolviendo True si se eliminó o False si no se encontró
@router.delete("/{favorite_id}")
def delete_favorite(favorite_id: int, current_user: int = Depends(verify_user)):
    deleted = favorites_controller.remove_favorite(favorite_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": f"Favorite {favorite_id} deleted successfully"}