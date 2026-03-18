# Controller para manejar las rutas relacionadas con los juegos
from app.config.database import get_connection
from app.services import rawg_service

# Funciones de apoyo para manejar géneros, plataformas y juegos con sus relaciones. 

def _save_genre(conn, name: str) -> int:
    """Inserta un género si no existe y devuelve su id."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO genres (name) VALUES (%s)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """, (name,))
        return cur.fetchone()[0]

def _save_platform(conn, name: str) -> int:
    """Inserta una plataforma si no existe y devuelve su id."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO platforms (name) VALUES (%s)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """, (name,))
        return cur.fetchone()[0]

def _save_game(conn, game: dict) -> int:
    """Inserta o actualiza un juego y sus relaciones. Devuelve el id interno."""
    with conn.cursor() as cur:
        # 1. Upsert del juego principal
        cur.execute("""
            INSERT INTO games
                (rawg_id, name, released, rating, ratings_count,
                 metacritic, background_image, description, slug, esrb_rating)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (rawg_id) DO UPDATE SET
                name             = EXCLUDED.name,
                rating           = EXCLUDED.rating,
                ratings_count    = EXCLUDED.ratings_count,
                metacritic       = EXCLUDED.metacritic,
                background_image = EXCLUDED.background_image,
                description      = EXCLUDED.description,
                esrb_rating      = EXCLUDED.esrb_rating
            RETURNING id
        """, (
            game["rawg_id"], game["name"], game.get("released"),
            game.get("rating"), game.get("ratings_count", 0),
            game.get("metacritic"), game.get("background_image"),
            game.get("description"), game.get("slug"), game.get("esrb_rating"),
        ))
        game_id = cur.fetchone()[0]

        # 2. Géneros
        for genre_name in game.get("genres", []):
            genre_id = _save_genre(conn, genre_name)
            cur.execute("""
                INSERT INTO game_genres (game_id, genre_id)
                VALUES (%s, %s) ON CONFLICT DO NOTHING
            """, (game_id, genre_id))

        # 3. Plataformas
        for platform_name in game.get("platforms", []):
            platform_id = _save_platform(conn, platform_name)
            cur.execute("""
                INSERT INTO game_platforms (game_id, platform_id)
                VALUES (%s, %s) ON CONFLICT DO NOTHING
            """, (game_id, platform_id))

    conn.commit()
    return game_id

def _row_to_game(row) -> dict:
    """Convierte una fila de BD a dict."""
    return {
        "id": row[0], "rawg_id": row[1], "name": row[2],
        "released": str(row[3]) if row[3] else None,
        "rating": row[4], "ratings_count": row[5], "metacritic": row[6],
        "background_image": row[7], "description": row[8],
        "slug": row[9], "esrb_rating": row[10],
    }

def _attach_relations(conn, game: dict) -> dict:
    """Agrega géneros y plataformas a un dict de juego."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT g.id, g.name FROM genres g
            JOIN game_genres gg ON gg.genre_id = g.id
            WHERE gg.game_id = %s
        """, (game["id"],))
        game["genres"] = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        cur.execute("""
            SELECT p.id, p.name FROM platforms p
            JOIN game_platforms gp ON gp.platform_id = p.id
            WHERE gp.game_id = %s
        """, (game["id"],))
        game["platforms"] = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]
    return game

# CRUD y funciones específicas para manejar juegos.

def get_all_games(page: int = 1, page_size: int = 20, search: str = None) -> list:
    """
    Devuelve juegos desde la BD local.
    Si no hay suficientes, los trae de RAWG, los guarda y los devuelve.
    """
    conn = get_connection()
    offset = (page - 1) * page_size
    try:
        with conn.cursor() as cur:
            if search:
                cur.execute("""
                    SELECT * FROM games
                    WHERE name ILIKE %s
                    ORDER BY rating DESC NULLS LAST
                    LIMIT %s OFFSET %s
                """, (f"%{search}%", page_size, offset))
            else:
                cur.execute("""
                    SELECT * FROM games
                    ORDER BY rating DESC NULLS LAST
                    LIMIT %s OFFSET %s
                """, (page_size, offset))
            rows = cur.fetchall()

        # Si no hay datos locales, importar de RAWG
        if not rows:
            rawg_games = rawg_service.search_games(search, page, page_size) if search \
                         else rawg_service.get_popular_games(page, page_size)
            for g in rawg_games:
                _save_game(conn, g)
            # Volver a consultar
            with conn.cursor() as cur:
                if search:
                    cur.execute("""
                        SELECT * FROM games WHERE name ILIKE %s
                        ORDER BY rating DESC NULLS LAST LIMIT %s OFFSET %s
                    """, (f"%{search}%", page_size, offset))
                else:
                    cur.execute("""
                        SELECT * FROM games ORDER BY rating DESC NULLS LAST
                        LIMIT %s OFFSET %s
                    """, (page_size, offset))
                rows = cur.fetchall()

        games = [_attach_relations(conn, _row_to_game(r)) for r in rows]
        return games
    finally:
        conn.close()

# Obtener un juego por su id interno, incluyendo géneros y plataformas.
def get_game_by_id(game_id: int) -> dict | None:
    """Obtiene un juego por id interno."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM games WHERE id = %s", (game_id,))
            row = cur.fetchone()
        if not row:
            return None
        return _attach_relations(conn, _row_to_game(row))
    finally:
        conn.close()

# Obtener un juego por su id de RAWG, útil para evitar duplicados al importar.
def import_game_from_rawg(rawg_id: int) -> dict:
    """
    Trae el detalle de un juego de RAWG, lo guarda en BD y lo devuelve.
    Útil para importar juegos bajo demanda.
    """
    game_data = rawg_service.get_game_detail(rawg_id)
    conn = get_connection()
    try:
        internal_id = _save_game(conn, game_data)
        return get_game_by_id(internal_id)
    finally:
        conn.close()

# Actualiza campos editables de un juego. 
def update_game(game_id: int, fields: dict) -> dict | None:
    """Actualiza campos editables de un juego (PUT)."""
    allowed = ["name", "released", "rating", "metacritic",
               "background_image", "description", "esrb_rating"]
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return get_game_by_id(game_id)

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [game_id]

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE games SET {set_clause} WHERE id = %s", values)
        conn.commit()
        return get_game_by_id(game_id)
    finally:
        conn.close()

# Elimina un juego por id. Devuelve True si existía.
def delete_game(game_id: int) -> bool:
    """Elimina un juego por id. Devuelve True si existía."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM games WHERE id = %s RETURNING id", (game_id,))
            deleted = cur.fetchone()
        conn.commit()
        return deleted is not None
    finally:
        conn.close()

# Función específica para importar lanzamientos recientes de RAWG, guardarlos y devolverlos.
def get_new_releases_controller(page: int = 1, page_size: int = 20) -> list:
    """Importa los lanzamientos recientes de RAWG y los devuelve."""
    conn = get_connection()
    try:
        rawg_games = rawg_service.get_new_releases(page, page_size)
        for g in rawg_games:
            _save_game(conn, g)
        with conn.cursor() as cur:
            offset = (page - 1) * page_size
            cur.execute("""
                SELECT * FROM games
                ORDER BY released DESC NULLS LAST
                LIMIT %s OFFSET %s
            """, (page_size, offset))
            rows = cur.fetchall()
        return [_attach_relations(conn, _row_to_game(r)) for r in rows]
    finally:
        conn.close()