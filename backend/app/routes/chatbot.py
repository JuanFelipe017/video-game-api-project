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
GROQ_MODEL   = os.getenv("GROQ_MODEL")


class ChatHistoryMessage(BaseModel):
    role: str      # "user" o "assistant"
    content: str


class ChatMessage(BaseModel):
    message: str
    history: List[ChatHistoryMessage] = []  # historial previo de la conversación


def get_games_context() -> str:
    """Obtiene los juegos de la base de datos para dárselos al modelo como contexto."""
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("""
            SELECT g.name, g.rating, STRING_AGG(DISTINCT ge.name, ', ') AS genres
            FROM games g
            LEFT JOIN game_genres gg ON g.id = gg.game_id
            LEFT JOIN genres ge ON gg.genre_id = ge.id
            GROUP BY g.id, g.name, g.rating
            ORDER BY g.rating DESC NULLS LAST
            LIMIT 50
        """)
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
            detail="GROQ_API_KEY no está configurada en las variables de entorno."
        )

    games_context = get_games_context()

    system_prompt = f"""Eres GameBot, el asistente de recomendaciones de videojuegos de GameHub.
Tu trabajo es ayudar a los usuarios a encontrar juegos que les gusten basándote 
ÚNICAMENTE en el catálogo disponible en GameHub.

{games_context}

Reglas:
- Recomienda solo juegos que estén en el catálogo anterior.
- Sé amigable, conciso y entusiasta.
- Si el usuario pide un género o tipo de juego, filtra por géneros del catálogo.
- Si no hay juegos que coincidan, díselo amablemente y sugiere algo cercano.
- Responde siempre en español.
- Máximo 3 recomendaciones por respuesta.
- Para cada recomendación menciona el nombre, el rating y por qué lo recomiendas.
- Recuerda el contexto de la conversación para dar respuestas coherentes."""

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

    try:
        response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data  = response.json()
        reply = data["choices"][0]["message"]["content"]
        return {"reply": reply}

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="El servicio de IA tardó demasiado en responder.")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Error al contactar la API de Groq: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")