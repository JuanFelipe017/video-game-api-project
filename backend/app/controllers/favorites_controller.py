from app.services import favorites_service

def get_favorites(user_id):
    return favorites_service.get_favorites(user_id)

def add_favorite(user_id, game_id):
    return favorites_service.add_favorite(user_id, game_id)

def remove_favorite(favorite_id):
    favorites_service.remove_favorite(favorite_id)