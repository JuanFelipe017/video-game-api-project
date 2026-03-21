# Archivo principal de la aplicación FastAPI, donde se configura la app, se añaden los routers de las rutas y se define la ruta raíz para verificar que la API está corriendo.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, favorites, games

app = FastAPI(title="GameHub API", version="1.0.0") # Configuración básica de la app FastAPI.

# CORS: permite que el frontend consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://storage.googleapis.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "x-user-id"],  
)

# Agrega los routers de las rutas de usuarios, favoritos y juegos, con sus respectivos prefijos.
app.include_router(users.router,     prefix="/api/users")
app.include_router(favorites.router, prefix="/api/favorites")
app.include_router(games.router,     prefix="/api/games")

# Ruta raíz para verificar que la API está corriendo, devuelve un mensaje simple.
@app.get("/")
def root():
    return {"message": "GameHub API running"}