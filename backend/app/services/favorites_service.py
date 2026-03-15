from app.config.database import get_connection

def get_favorites(user_id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT games.*
        FROM favorites
        JOIN games ON favorites.game_id = games.id
        WHERE favorites.user_id = %s
        """,
        (user_id,)
    )

    favorites = cur.fetchall()

    cur.close()
    conn.close()

    return favorites


def add_favorite(user_id, game_id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO favorites(user_id, game_id)
        VALUES(%s,%s)
        RETURNING *
        """,
        (user_id, game_id)
    )

    favorite = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return favorite


def remove_favorite(favorite_id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "DELETE FROM favorites WHERE id=%s",
        (favorite_id,)
    )

    conn.commit()
    cur.close()
    conn.close()