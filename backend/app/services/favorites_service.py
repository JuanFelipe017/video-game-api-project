# Favoritos de juegos: lógica para manejar favoritos de juegos por usuario, con funciones para obtener, agregar y eliminar favoritos.
import psycopg2
from app.config.database import get_connection

# Servicio de favoritos: lógica para manejar favoritos de juegos por usuario.
def get_favorites(user_id: int) -> list:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    f.id        AS favorite_id,
                    f.user_id,
                    f.game_id,
                    g.name,
                    g.rating,
                    g.background_image,
                    g.released,
                    g.slug
                FROM favorites f
                JOIN games g ON f.game_id = g.id
                WHERE f.user_id = %s
                ORDER BY f.created_at DESC
            """, (user_id,))
            rows = cur.fetchall()

        return [
            {
                "id":               row[0],
                "user_id":          row[1],
                "game_id":          row[2],
                "game": {
                    "name":             row[3],
                    "rating":           row[4],
                    "background_image": row[5],
                    "released":         str(row[6]) if row[6] else None,
                    "slug":             row[7],
                }
            }
            for row in rows
        ]
    finally:
        conn.close()

# Agrega un juego a favoritos, evitando duplicados 
def add_favorite(user_id: int, game_id: int) -> dict | None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO favorites (user_id, game_id)
                VALUES (%s, %s)
                RETURNING id, user_id, game_id
            """, (user_id, game_id))
            row = cur.fetchone()
        conn.commit()
        return {"id": row[0], "user_id": row[1], "game_id": row[2]}
    except psycopg2.errors.UniqueViolation:
        # La tabla tiene UNIQUE(user_id, game_id) — ya existe
        conn.rollback()
        return None
    finally:
        conn.close()

# Elimina un favorito por su ID, devuelve True si se eliminó, False si no se encontró
def remove_favorite(favorite_id: int) -> bool:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM favorites WHERE id = %s RETURNING id",
                (favorite_id,)
            )
            deleted = cur.fetchone()
        conn.commit()
        return deleted is not None
    finally:
        conn.close()