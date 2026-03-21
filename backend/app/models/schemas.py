# Esquemas de Pydantic para validar datos de entrada y salida en la API.
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# Géneros
class GenreBase(BaseModel):
    name: str

class GenreOut(GenreBase):
    id: int

# Plataformas 
class PlatformBase(BaseModel):
    name: str

class PlatformOut(PlatformBase):
    id: int

# Juegos 
class GameBase(BaseModel):
    rawg_id: int
    name: str
    released: Optional[date] = None
    rating: Optional[float] = None
    ratings_count: Optional[int] = 0
    metacritic: Optional[int] = None
    background_image: Optional[str] = None
    description: Optional[str] = None
    slug: Optional[str] = None
    esrb_rating: Optional[str] = None

class GameOut(GameBase):
    id: int
    genres: List[GenreOut] = []
    platforms: List[PlatformOut] = []

class GameUpdate(BaseModel):
    name: Optional[str] = None
    released: Optional[date] = None
    rating: Optional[float] = None
    metacritic: Optional[int] = None
    background_image: Optional[str] = None
    description: Optional[str] = None
    esrb_rating: Optional[str] = None

# Favoritos 
class FavoriteCreate(BaseModel):
    user_id: int
    game_id: int

class FavoriteOut(BaseModel):
    id: int
    user_id: int
    game_id: int
    game: Optional[GameOut] = None

# Usuarios (para autenticación)
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str

class UserLogin(BaseModel):
    email: str
    password: str