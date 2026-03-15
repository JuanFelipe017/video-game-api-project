from app.config.database import get_connection

def register(username, email, password):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO users(username,email,password)
        VALUES(%s,%s,%s)
        RETURNING *
        """,
        (username, email, password)
    )

    user = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return user


def login(email, password):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT * FROM users
        WHERE email=%s AND password=%s
        """,
        (email, password)
    )

    user = cur.fetchone()

    cur.close()
    conn.close()

    return user