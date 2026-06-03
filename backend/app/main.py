# Archivo principal de la aplicación FastAPI, donde se configura la app, se añaden los routers de las rutas y se define la ruta raíz para verificar que la API está corriendo.
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, favorites, games
from app.routes import users, favorites, games, chatbot

app = FastAPI(title="GameHub API", version="1.0.0") # Configuración básica de la app FastAPI.

# CORS: permite que el frontend consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://gamehub-front-back-556939640766.us-central1.run.app",
        "http://localhost:4321",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "x-user-id"],
)
# Agrega los routers de las rutas de usuarios, favoritos y juegos, con sus respectivos prefijos.
app.include_router(users.router,     prefix="/api/users")
app.include_router(favorites.router, prefix="/api/favorites")
app.include_router(games.router,     prefix="/api/games")
app.include_router(chatbot.router, prefix="/api/chat")

# Ruta raíz para verificar que la API está corriendo, devuelve un mensaje simple.
@app.get("/")
def root():
    return {"message": "GameHub API running"}