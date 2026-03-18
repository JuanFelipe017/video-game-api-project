# Rutas relacionadas con juegos: listado, detalle, importación desde RAWG, actualización y eliminación.
from fastapi import APIRouter, HTTPException, Query
from app.controllers import games_controller
from app.models.schemas import GameUpdate

router = APIRouter()

# GET /api/games — lista de juegos (con búsqueda y paginación)
@router.get("/")
def list_games(
    page:      int   = Query(1,  ge=1),
    page_size: int   = Query(20, ge=1, le=100),
    search:    str   = Query(None),
):
    games = games_controller.get_all_games(page, page_size, search)
    return {"page": page, "page_size": page_size, "results": games}


# GET /api/games/new-releases — lanzamientos recientes
@router.get("/new-releases")
def new_releases(
    page:      int = Query(1,  ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    games = games_controller.get_new_releases_controller(page, page_size)
    return {"page": page, "page_size": page_size, "results": games}


# GET /api/games/{id} — detalle de un juego
@router.get("/{game_id}")
def get_game(game_id: int):
    game = games_controller.get_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


# POST /api/games/import/{rawg_id} — importar juego desde RAWG a nuestra BD
@router.post("/import/{rawg_id}")
def import_game(rawg_id: int):
    try:
        game = games_controller.import_game_from_rawg(rawg_id)
        return game
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# PUT /api/games/{id} — actualizar un juego
@router.put("/{game_id}")
def update_game(game_id: int, body: GameUpdate):
    game = games_controller.update_game(game_id, body.dict())
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


# DELETE /api/games/{id} — eliminar un juego
@router.delete("/{game_id}")
def delete_game(game_id: int):
    deleted = games_controller.delete_game(game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"message": f"Game {game_id} deleted successfully"}