# Servicio para interactuar con la API de RAWG: funciones para obtener juegos populares, nuevos lanzamientos, buscar por nombre, obtener detalles y filtrar por género.
import requests
import os

API_KEY = os.getenv("RAWG_API_KEY") # API KEY de RAWG, que se debe configurar en el .env anteriormente. 
BASE_URL = "https://api.rawg.io/api" # URL base de la API de RAWG.

# Función genérica para hacer llamadas GET a RAWG, que incluye la API key y maneja errores.
def _get(endpoint: str, params: dict = {}):
    """Llamada GET genérica a RAWG con la API key."""
    params["key"] = API_KEY
    response = requests.get(f"{BASE_URL}/{endpoint}", params=params)
    response.raise_for_status()
    return response.json()

# Función para convertir un juego de RAWG al formato de nuestra base de datos, extrayendo los campos necesarios.
def _parse_game(raw: dict) -> dict:
    """Convierte un juego de RAWG al formato de nuestra BD."""
    return {
        "rawg_id":          raw.get("id"),
        "name":             raw.get("name"),
        "released":         raw.get("released"),
        "rating":           raw.get("rating"),
        "ratings_count":    raw.get("ratings_count", 0),
        "metacritic":       raw.get("metacritic"),
        "background_image": raw.get("background_image"),
        "slug":             raw.get("slug"),
        "esrb_rating":      raw.get("esrb_rating", {}).get("name") if raw.get("esrb_rating") else None,
        "genres":    [g["name"] for g in raw.get("genres", [])],
        "platforms": [p["platform"]["name"] for p in raw.get("platforms", [])],
    }

# Funciones específicas para obtener juegos populares, nuevos lanzamientos, buscar por nombre, obtener detalles y filtrar por género, que llaman a la función genérica _get y luego parsean los resultados.
def get_popular_games(page: int = 1, page_size: int = 20) -> list:
    """Juegos populares ordenados por rating."""
    data = _get("games", {
        "ordering":  "-rating",
        "page":      page,
        "page_size": page_size,
    })
    return [_parse_game(g) for g in data.get("results", [])]

# Función para obtener lanzamientos recientes, ordenados por fecha de lanzamiento (más recientes primero).
def get_new_releases(page: int = 1, page_size: int = 20) -> list:
    """Juegos ordenados por fecha de lanzamiento (más recientes primero)."""
    data = _get("games", {
        "ordering":  "-released",
        "page":      page,
        "page_size": page_size,
    })
    return [_parse_game(g) for g in data.get("results", [])]

# Función para buscar juegos por nombre, usando el parámetro de búsqueda de RAWG.
def search_games(query: str, page: int = 1, page_size: int = 20) -> list:
    """Busca juegos por nombre."""
    data = _get("games", {
        "search":    query,
        "page":      page,
        "page_size": page_size,
    })
    return [_parse_game(g) for g in data.get("results", [])]

# Función para obtener el detalle completo de un juego por su ID de RAWG, incluyendo la descripción.
def get_game_detail(rawg_id: int) -> dict:
    """Detalle completo de un juego (incluye description)."""
    raw = _get(f"games/{rawg_id}")
    game = _parse_game(raw)
    # description_raw viene en HTML, lo guardamos tal cual
    game["description"] = raw.get("description_raw") or raw.get("description")
    return game

# Función para obtener juegos filtrados por género, usando el parámetro de filtro de RAWG.
def get_games_by_genre(genre: str, page: int = 1, page_size: int = 20) -> list:
    """Juegos filtrados por género (slug de RAWG, ej: 'action', 'rpg')."""
    data = _get("games", {
        "genres":    genre,
        "ordering":  "-rating",
        "page":      page,
        "page_size": page_size,
    })
    return [_parse_game(g) for g in data.get("results", [])]