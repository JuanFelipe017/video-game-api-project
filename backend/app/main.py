from fastapi import FastAPI
from app.routes import users, favorites

app = FastAPI()

app.include_router(users.router, prefix="/api/users")
app.include_router(favorites.router, prefix="/api/favorites")

@app.get("/")
def root():
    return {"message": "Games API running"}