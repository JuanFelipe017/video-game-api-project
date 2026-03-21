# Controller para manejar las rutas relacionadas con los favoritos de los usuarios
from app.services import favorites_service

# Funciones del controller que llaman a los servicios correspondientes
def get_favorites(user_id: int) -> list:
    return favorites_service.get_favorites(user_id)

# Agrega un juego a los favoritos de un usuario, verificando que no esté ya agregado
def add_favorite(user_id: int, game_id: int) -> dict:
    result = favorites_service.add_favorite(user_id, game_id)
    if not result:
        return {"error": "El juego ya está en favoritos"}
    return {"ok": True, "favorite": result}

# Elimina un favorito por su ID, devolviendo True si se eliminó o False si no se encontró
def remove_favorite(favorite_id: int) -> bool:
    return favorites_service.remove_favorite(favorite_id)