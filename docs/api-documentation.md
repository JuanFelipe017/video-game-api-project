# 📡 GameHub — Documentación de API

Base URL (local): `http://localhost:8000/api`  
Base URL (producción): `https://[URL-PENDIENTE]/api`

---

## Códigos de estado HTTP

| Código | Significado |
|---|---|
| `200` | OK — solicitud exitosa |
| `201` | Created — recurso creado exitosamente |
| `400` | Bad Request — datos inválidos o duplicados |
| `401` | Unauthorized — credenciales incorrectas |
| `404` | Not Found — recurso no encontrado |
| `500` | Internal Server Error — error del servidor |

---

## Formato de errores

Todos los errores devuelven el mismo formato:

```json
{
  "detail": "Descripción del error"
}
```

---

## 🎮 Juegos — `/api/games`

### GET `/api/games/`
Lista juegos almacenados en la BD. Si la BD está vacía, importa automáticamente desde RAWG.

**Parámetros query:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `page` | integer | No (default: 1) | Número de página |
| `page_size` | integer | No (default: 20, max: 100) | Resultados por página |
| `search` | string | No | Buscar por nombre |

**Request:**
```
GET /api/games/?page=1&page_size=6&search=zelda
```

**Response 200:**
```json
{
  "page": 1,
  "page_size": 6,
  "results": [
    {
      "id": 1,
      "rawg_id": 3498,
      "name": "Grand Theft Auto V",
      "released": "2013-09-17",
      "rating": 4.47,
      "ratings_count": 6324,
      "metacritic": 97,
      "background_image": "https://media.rawg.io/media/games/...",
      "description": "...",
      "slug": "grand-theft-auto-v",
      "esrb_rating": "Mature",
      "genres": [
        { "id": 1, "name": "Action" },
        { "id": 2, "name": "Adventure" }
      ],
      "platforms": [
        { "id": 1, "name": "PlayStation 4" },
        { "id": 2, "name": "PC" }
      ]
    }
  ]
}
```

---

### GET `/api/games/new-releases`
Devuelve juegos ordenados por fecha de lanzamiento más reciente.

**Parámetros query:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `page` | integer | No (default: 1) | Número de página |
| `page_size` | integer | No (default: 20) | Resultados por página |

**Request:**
```
GET /api/games/new-releases?page=1&page_size=6
```

**Response 200:**
```json
{
  "page": 1,
  "page_size": 6,
  "results": [ ... ]
}
```

---

### GET `/api/games/{game_id}`
Obtiene el detalle completo de un juego por su ID interno.

**Parámetros path:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `game_id` | integer | ID interno del juego en la BD |

**Request:**
```
GET /api/games/1
```

**Response 200:**
```json
{
  "id": 1,
  "rawg_id": 3498,
  "name": "Grand Theft Auto V",
  "released": "2013-09-17",
  "rating": 4.47,
  "genres": [...],
  "platforms": [...]
}
```

**Response 404:**
```json
{
  "detail": "Game not found"
}
```

---

### POST `/api/games/import/{rawg_id}`
Importa un juego directamente desde RAWG a la BD local usando su ID de RAWG.

**Parámetros path:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `rawg_id` | integer | ID del juego en RAWG |

**Request:**
```
POST /api/games/import/3498
```

**Response 200:**
```json
{
  "id": 1,
  "rawg_id": 3498,
  "name": "Grand Theft Auto V",
  ...
}
```

**Response 400:**
```json
{
  "detail": "Descripción del error de RAWG"
}
```

---

### PUT `/api/games/{game_id}`
Actualiza campos editables de un juego existente.

**Parámetros path:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `game_id` | integer | ID interno del juego |

**Body (JSON) — todos los campos son opcionales:**
```json
{
  "name": "Nuevo nombre",
  "released": "2023-01-15",
  "rating": 4.8,
  "metacritic": 95,
  "background_image": "https://...",
  "description": "Nueva descripción",
  "esrb_rating": "Mature"
}
```

**Request:**
```
PUT /api/games/1
Content-Type: application/json

{
  "rating": 4.9,
  "description": "Descripción actualizada"
}
```

**Response 200:**
```json
{
  "id": 1,
  "name": "Grand Theft Auto V",
  "rating": 4.9,
  ...
}
```

**Response 404:**
```json
{
  "detail": "Game not found"
}
```

---

### DELETE `/api/games/{game_id}`
Elimina un juego de la BD por su ID interno.

**Request:**
```
DELETE /api/games/1
```

**Response 200:**
```json
{
  "message": "Game 1 deleted successfully"
}
```

**Response 404:**
```json
{
  "detail": "Game not found"
}
```

---

## 👤 Usuarios — `/api/users`

### POST `/api/users/register`
Registra un nuevo usuario. La contraseña se almacena encriptada con bcrypt.

**Body (JSON):**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `username` | string | Sí | Nombre de usuario único |
| `email` | string | Sí | Email único |
| `password` | string | Sí | Contraseña (mínimo 6 caracteres) |

**Request:**
```
POST /api/users/register
Content-Type: application/json

{
  "username": "gamer123",
  "email": "gamer@example.com",
  "password": "mipassword"
}
```

**Response 200:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "gamer123",
    "email": "gamer@example.com"
  }
}
```

**Response 400 (email o usuario ya existe):**
```json
{
  "detail": "El email o nombre de usuario ya está en uso"
}
```

---

### POST `/api/users/login`
Autentica un usuario existente.

**Body (JSON):**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `email` | string | Sí | Email registrado |
| `password` | string | Sí | Contraseña |

**Request:**
```
POST /api/users/login
Content-Type: application/json

{
  "email": "gamer@example.com",
  "password": "mipassword"
}
```

**Response 200:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "gamer123",
    "email": "gamer@example.com"
  }
}
```

**Response 401:**
```json
{
  "detail": "Email o contraseña incorrectos"
}
```

---

## ⭐ Favoritos — `/api/favorites`

### GET `/api/favorites/{user_id}`
Obtiene la lista de juegos favoritos de un usuario.

**Parámetros path:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `user_id` | integer | ID del usuario |

**Request:**
```
GET /api/favorites/1
```

**Response 200:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "game_id": 3,
    "game": {
      "id": 3,
      "name": "Elden Ring",
      "rating": 4.9,
      "background_image": "https://..."
    }
  }
]
```

---

### POST `/api/favorites/`
Agrega un juego a los favoritos de un usuario.

**Body (JSON):**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `user_id` | integer | Sí | ID del usuario |
| `game_id` | integer | Sí | ID interno del juego |

**Request:**
```
POST /api/favorites/
Content-Type: application/json

{
  "user_id": 1,
  "game_id": 3
}
```

**Response 200:**
```json
{
  "id": 1,
  "user_id": 1,
  "game_id": 3
}
```

**Response 400 (ya existe):**
```json
{
  "detail": "El juego ya está en favoritos"
}
```

---

### DELETE `/api/favorites/{favorite_id}`
Elimina un favorito por su ID.

**Parámetros path:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `favorite_id` | integer | ID del registro en la tabla favorites |

**Request:**
```
DELETE /api/favorites/1
```

**Response 200:**
```json
{
  "message": "Favorite 1 deleted successfully"
}
```

**Response 404:**
```json
{
  "detail": "Favorite not found"
}
```