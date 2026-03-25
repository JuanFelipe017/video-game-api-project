# 🎮 GameHub

Plataforma web para descubrir, explorar y guardar videojuegos favoritos. Consume datos de la API pública de RAWG para construir una API propia con backend en FastAPI, base de datos PostgreSQL en Google Cloud SQL y frontend en Astro.js.

---

## 👥 Integrantes y responsabilidades

| Integrante | Responsabilidad |
|---|---|
| Juan Felipe Vanegas Silva | Backend — FastAPI, endpoints, servicios / Frontend — JavaScript, HTML, CSS |
| Diego Felipe Almanza Ruiz | Base de datos — PostgreSQL, GCP Cloud SQL, esquemas / Frontend — HTML |
| Martin Elias Perez Mercado | Cloud Run, Frontend Astro.js, manejo de Astro, arreglos de peticiones entre back y front, API personal |

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Python 3.13) |
| Base de datos | PostgreSQL 15 |
| Frontend | Astro.js (migrado desde HTML/CSS/JavaScript vanilla) |
| Cloud | Google Cloud Platform (GCP) |
| Contenedores | Docker + Cloud Run |
| API externa | RAWG Video Games Database API |
| Encriptación | bcrypt |

---

## 📝 Nota sobre la migración del frontend

El frontend fue desarrollado inicialmente en HTML, CSS y JavaScript vanilla. Durante el proceso de despliegue se encontraron problemas de compatibilidad con Cloud Storage (Mixed Content, manejo de módulos ES6) que dificultaron la integración con el backend. Por esta razón se tomó la decisión de migrar el frontend a **Astro.js**, lo que permitió:

- Resolver los problemas de peticiones entre frontend y backend
- Mejor manejo de variables de entorno (`PUBLIC_API_URL`)
- Despliegue más sencillo mediante Docker en Cloud Run
- Mejor estructura y organización del proyecto

---

## ☁️ Servicios cloud implementados

| Servicio GCP | Uso |
|---|---|
| Cloud SQL | Instancia PostgreSQL — almacenamiento de usuarios, juegos y favoritos |
| Cloud Run | Despliegue del backend FastAPI y frontend Astro.js |
| Artifact Registry | Almacenamiento de imágenes Docker |

---

## 🌐 URLs de acceso

| Componente | URL |
|---|---|
| Frontend | `https://gamehub-front-back-556939640766.us-central1.run.app` |
| Backend API | `https://gamehub-backend-556939640766.us-central1.run.app` |
| Documentación Swagger | `https://gamehub-backend-556939640766.us-central1.run.app/docs` |

---

## 🎥 Video de sustentación

[Ver video de sustentación en Google Drive](https://drive.google.com/file/d/1C1AcDjtspgHwfZi2m_oIZE69abYrjaQG/view?usp=sharing)

---

## 🏗️ Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO (Navegador)                │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────┐
│         FRONTEND (GCP Cloud Run)                     │
│              Astro.js (SSR)                          │
│     /  /games  /login  /register  /favorites         │
└─────────────────────┬───────────────────────────────┘
                      │ REST API calls
┌─────────────────────▼───────────────────────────────┐
│        BACKEND API (GCP Cloud Run)                   │
│               FastAPI (Python)                       │
│  /api/games  /api/users  /api/favorites              │
└──────┬──────────────────────────┬───────────────────┘
       │ Consultas SQL             │ HTTP requests
┌──────▼──────────┐    ┌──────────▼──────────────────┐
│  GCP Cloud SQL  │    │    RAWG API (externa)        │
│  PostgreSQL 15  │    │  api.rawg.io/api/games       │
│                 │    │  (fuente de datos inicial)   │
│  - users        │    └─────────────────────────────┘
│  - games        │
│  - favorites    │
│  - genres       │
│  - platforms    │
└─────────────────┘
```

---

## 💻 Instalación local

### Requisitos previos
- Python 3.10+
- Node.js 18+
- PostgreSQL 15 (local o acceso a GCP Cloud SQL)
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/JuanFelipe017/video-game-api-project.git
cd video-game-api-project
```

### 2. Configurar el backend

```bash
cd backend
pip install -r requirements.txt
```

Crear el archivo `backend/.env`:

```env
RAWG_API_KEY=tu_api_key_personal  # Obtener en https://rawg.io/apidocs
PGHOST=localhost
PGPORT=5432
PGUSER=tu_usuario
PGPASSWORD=tu_contraseña
PGDATABASE=gamehub
```

### 3. Crear las tablas en PostgreSQL

```bash
psql -U tu_usuario -d gamehub -f database/schema.sql
```

### 4. Levantar el backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

El backend queda disponible en: `http://localhost:8000`
Documentación Swagger en: `http://localhost:8000/docs`

### 5. Configurar y levantar el frontend

```bash
cd frontend/HUB_GAMES
npm install
npm run dev
```

Crear el archivo `frontend/HUB_GAMES/.env`:

```env
PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 Comandos de despliegue en GCP

Ver la guía completa en [`docs/deployment-guide.md`](docs/deployment-guide.md)

---

## ⚠️ Problemas encontrados y soluciones

| Problema | Solución |
|---|---|
| `ModuleNotFoundError: No module named 'app'` | Ejecutar uvicorn desde dentro de la carpeta `backend/`, no desde la raíz del proyecto |
| Sección `New releases` cortada en el HTML | El hero estaba dentro de `main` con `max-width` limitado; se restructuró el layout con CSS Grid en el header |
| `Connection refused` en PostgreSQL | La BD local no estaba activa; se migró directamente a GCP Cloud SQL |
| Imports incorrectos en Pylance | Las rutas de módulos no coincidían con la estructura real de carpetas (`app.config.database`, `app.services`, `app.models.schemas`) |
| Contraseñas en texto plano | Se implementó encriptación con `bcrypt` en `auth_service.py` |
| `Mixed Content` en Cloud Storage | El frontend en HTTPS intentaba llamar al backend en HTTP; se migró a Astro.js en Cloud Run |
| `CORS error` entre frontend y backend | Se configuró `allow_origins` en `main.py` con el dominio real del frontend en Cloud Run |
| Conflictos de ramas en Git | Se resolvió con `git reset --hard origin/dev_stable` para sincronizar master con la rama estable |

---

## 📁 Estructura del repositorio

```
video-game-api-project/
├── README.md
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   └── database.py
│   │   ├── controllers/
│   │   │   ├── favorites_controller.py
│   │   │   ├── games_controller.py
│   │   │   └── users_controller.py
│   │   ├── middleware/
│   │   │   └── auth_middleware.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   ├── routes/
│   │   │   ├── favorites.py
│   │   │   ├── games.py
│   │   │   └── users.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── favorites_service.py
│   │   │   └── rawg_service.py
│   │   └── main.py
│   ├── DOCKERFILE
│   ├── .env
│   └── requirements.txt
├── frontend/
│   └── HUB_GAMES/
│       ├── .astro/
│       ├── public/
│       │   ├── favicon.ico
│       │   └── favicon.svg
│       ├── src/
│       │   ├── assets/
│       │   │   ├── astro.svg
│       │   │   └── background.svg
│       │   ├── components/
│       │   │   ├── FavoriteButton.tsx
│       │   │   ├── FavoritesGrid.tsx
│       │   │   ├── GameCard.tsx
│       │   │   ├── LoginForm.tsx
│       │   │   ├── NavBar.tsx
│       │   │   └── Welcome.astro
│       │   ├── layouts/
│       │   │   └── MainLayout.astro
│       │   ├── lib/
│       │   ├── pages/
│       │   ├── styles/
│       │   └── types/
│       ├── astro.config.mjs
│       ├── package.json
│       ├── tailwind.config.mjs
│       └── tsconfig.json
├── database/
│   ├── diagram.png
│   ├── docker-compose.yml
│   ├── schema.sql
│   └── seed.sql
└── docs/
    ├── api-documentation.md
    └── deployment-guide.md
```