# Ruta del chatbot de GameHub. Recibe mensajes del usuario y responde con
# recomendaciones de videojuegos usando la API de Groq (LLaMA 3.3).
# Soporta historial de conversación para mantener el contexto entre mensajes.

import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.config.database import get_connection
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv("GROQ_API_URL")
GROQ_MODEL = os.getenv("GROQ_MODEL")


class ChatHistoryMessage(BaseModel):
    role: str  # "user" o "assistant"
    content: str


class ChatMessage(BaseModel):
    message: str
    history: List[ChatHistoryMessage] = []


def search_game_in_db(game_name: str) -> dict:
    """Busca un juego específico en la BD por nombre exacto o similar."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # Primero intenta búsqueda exacta (case-insensitive)
        cur.execute(
            """
            SELECT g.id, g.name, g.rating, g.description, STRING_AGG(DISTINCT ge.name, ', ') AS genres
            FROM games g
            LEFT JOIN game_genres gg ON g.id = gg.game_id
            LEFT JOIN genres ge ON gg.genre_id = ge.id
            WHERE LOWER(TRIM(g.name)) = LOWER(TRIM(%s))
            GROUP BY g.id, g.name, g.rating, g.description
            LIMIT 1
            """,
            [game_name],
        )
        
        row = cur.fetchone()
        
        if not row:
            # Si no encuentra exacto, busca parcial
            cur.execute(
                """
                SELECT g.id, g.name, g.rating, g.description, STRING_AGG(DISTINCT ge.name, ', ') AS genres
                FROM games g
                LEFT JOIN game_genres gg ON g.id = gg.game_id
                LEFT JOIN genres ge ON gg.genre_id = ge.id
                WHERE LOWER(g.name) LIKE LOWER(%s)
                GROUP BY g.id, g.name, g.rating, g.description
                ORDER BY g.rating DESC NULLS LAST
                LIMIT 1
                """,
                [f"%{game_name}%"],
            )
            row = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if row:
            return {
                "found": True,
                "name": row[1],
                "rating": row[2],
                "description": row[3],
                "genres": row[4] or "Sin géneros",
            }
        
        return {"found": False}
    
    except Exception as e:
        print(f"Error buscando juego específico: {str(e)}")
        return {"found": False}


def get_games_context(limit: int = 300) -> str:
    """Obtiene los juegos de la base de datos para dárselos al modelo como contexto."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT g.name, g.rating, STRING_AGG(DISTINCT ge.name, ', ') AS genres
            FROM games g
            LEFT JOIN game_genres gg ON g.id = gg.game_id
            LEFT JOIN genres ge ON gg.genre_id = ge.id
            GROUP BY g.id, g.name, g.rating
            ORDER BY g.rating DESC NULLS LAST
            LIMIT %s
        """,
            [limit],
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return "No hay juegos en la base de datos. Responde con tu conocimiento general de videojuegos populares."

        lines = ["Juegos disponibles en GameHub (nombre | rating | géneros):"]
        for name, rating, genres in rows:
            rating_str = f"{rating:.1f}" if rating else "sin rating"
            genres_str = genres if genres else "sin géneros"
            lines.append(f"- {name} | {rating_str} | {genres_str}")

        return "\n".join(lines)

    except Exception:
        return "El catálogo no está disponible en este momento. Usa tu conocimiento general para recomendar videojuegos populares y bien valorados."


def is_game_query(message: str) -> bool:
    """
    Detecta si el mensaje es una pregunta seria sobre juegos/géneros.
    Retorna False para saludos simples, preguntas genéricas o mensajes cortos.
    """
    message_lower = message.lower().strip()

    # Palabras clave que indican pregunta sobre juegos
    game_keywords = [
        "juego",
        "game",
        "género",
        "genero",
        "tipo",
        "recomend",
        "quiero",
        "busco",
        "tenéis",
        "teneis",
        "tienes",
        "tengo",
        "similar",
        "parecid",
        "acción",
        "rpg",
        "estrategia",
        "puzzle",
        "aventura",
        "horror",
        "indie",
        "multiplayer",
        "single",
        "fps",
        "mmo",
        "roguelike",
    ]

    # Palabras que indican saludo o conversación genérica
    greeting_keywords = [
        "hola",
        "hello",
        "hi",
        "hey",
        "bot",
        "chatbot",
        "qué tal",
        "cómo estás",
        "buenos días",
        "buenas tardes",
        "buenas noches",
        "saludos",
    ]

    # Si tiene solo saludos y el mensaje es muy corto, no es una pregunta seria
    if len(message_lower) < 15:
        for greeting in greeting_keywords:
            if greeting in message_lower:
                # Verificar si también tiene palabras de juegos
                has_game_keyword = any(kw in message_lower for kw in game_keywords)
                if not has_game_keyword:
                    return False

    # Verificar si contiene palabras clave de juegos
    has_game_keyword = any(kw in message_lower for kw in game_keywords)

    return has_game_keyword


@router.post("/")
def chat(body: ChatMessage):
    """
    Recibe un mensaje del usuario y el historial de conversación,
    y devuelve una recomendación de videojuegos generada por LLaMA 3.3 de Groq.
    El historial permite que el chatbot recuerde mensajes anteriores.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY no está configurada en las variables de entorno.",
        )

    try:
        # Verificar si es una pregunta seria sobre juegos
        if not is_game_query(body.message):
            # Es un saludo o pregunta genérica - responder amablemente sin recomendar
            system_prompt = """Eres GameBot, el asistente de recomendaciones de videojuegos de GameHub.
El usuario te está saludando. Responde de forma amable y brevemente, invitándolo a 
preguntarte por juegos, géneros o recomendaciones. 

Sé entusiasta pero conciso. NO hagas recomendaciones no solicitadas."""
        else:
            # Es una pregunta sobre juegos - usar contexto ampliado de la BD
            games_context = get_games_context(limit=300)

            # Intentar buscar si el usuario pregunta por un juego específico
            specific_game_info = ""
            words = body.message.split()
            if len(words) <= 5:  # Probablemente pregunta por un juego específico
                potential_game = body.message.replace("¿", "").replace("?", "").strip()
                game_search = search_game_in_db(potential_game)
                if game_search["found"]:
                    specific_game_info = f"\n[ENCONTRADO EN BD] El juego '{game_search['name']}' SÍ está en nuestro catálogo con rating {game_search['rating']:.1f} y géneros: {game_search['genres']}"

            system_prompt = f"""Eres GameBot, el asistente de recomendaciones de videojuegos de GameHub.
Tu trabajo es ayudar a los usuarios a encontrar juegos que les gusten.

{games_context}
{specific_game_info}

Reglas CRÍTICAS - DEBES CUMPLIRLAS SIN EXCEPCIONES:
1. Los ratings y datos anteriores SON LA FUENTE DE VERDAD ABSOLUTA.
2. Cuando recomiendes un juego de la lista anterior, SIEMPRE usa EXACTAMENTE el rating que aparece.
3. NUNCA cambies el rating basándote en tu conocimiento entrenado.
4. Si aparece "[ENCONTRADO EN BD]" arriba, ese juego DEFINITIVAMENTE está en nuestro catálogo - récomendalo con seguridad.
5. Si el usuario pregunta por un juego específico y NO aparece "[ENCONTRADO EN BD]", entonces NO está en el catálogo.

Otras reglas:
- Prioriza recomendar juegos del catálogo anterior cuando sean relevantes.
- Si el usuario pregunta por un juego específico que no está en el catálogo, puedes usar tu conocimiento general.
- Sé amigable, conciso y entusiasta.
- Si el usuario pide un género, filtra por géneros del catálogo.
- Responde siempre en español.
- Máximo 3 recomendaciones por respuesta.
- Para cada recomendación menciona el nombre, el rating y por qué lo recomiendas usando **negrita** para el nombre del juego.
- Recuerda el contexto de la conversación para dar respuestas coherentes.
- Si el usuario pregunta por un juego específico y está en el catálogo, responde SOLO sobre ese juego CON SU RATING EXACTO de la lista.
- Si el usuario pregunta por un juego específico y NO está en el catálogo, dilo brevemente en máximo 2 líneas y pregunta qué otro tipo de juego le interesa. NO hagas recomendaciones no solicitadas."""

        # Construir el historial de mensajes para enviar a Groq
        messages = [{"role": "system", "content": system_prompt}]

        # Agregar el historial previo de la conversación
        for msg in body.history:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})

        # Agregar el mensaje actual del usuario
        messages.append({"role": "user", "content": body.message})

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": GROQ_MODEL,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7,
        }

        response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        return {"reply": reply}

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504, detail="El servicio de IA tardó demasiado en responder."
        )
    except requests.exceptions.HTTPError as e:
        raise HTTPException(
            status_code=502, detail=f"Error al contactar la API de Groq: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")