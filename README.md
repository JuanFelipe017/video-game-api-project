# 🎮 GameHub

Plataforma web para descubrir, explorar y guardar videojuegos favoritos. Consume datos de la API pública de RAWG para construir una API propia con backend en FastAPI, base de datos PostgreSQL en Google Cloud SQL y frontend en HTML/CSS/JavaScript.

---

## 👥 Integrantes y responsabilidades

| Integrante | Responsabilidad |
|---|---|
| Juan Felipe Vanegas Silva | Backend — FastAPI, endpoints, servicios / Frontend — JavaScript|
| Diego Felipe Almanza Ruiz | Base de datos — PostgreSQL, GCP Cloud SQL, esquemas / Frontend — HTML|
| Dayana Michelle Pulido Moguea | GCP Cloud SQL, esquemas / Frontend — CSS|

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Python 3.13) |
| Base de datos | PostgreSQL 15 |
| Frontend | HTML5 / CSS3 / JavaScript (Vanilla) |
| Cloud | Google Cloud Platform (GCP) |
| API externa | RAWG Video Games Database API |
| Encriptación | bcrypt |

---

## ☁️ Servicios cloud implementados

| Servicio GCP | Uso |
|---|---|
| Cloud SQL | Instancia PostgreSQL — almacenamiento de usuarios, juegos y favoritos |
| App Engine / Compute Engine | Despliegue del backend FastAPI |
| Cloud Storage | Hosting del frontend estático |

---

## 🌐 URLs de acceso

> Completar después del despliegue en GCP

| Componente | URL |
|---|---|
| Frontend | `https://[URL-PENDIENTE]` |
| Backend API | `https://[URL-PENDIENTE]` |
| Documentación Swagger | `https://[URL-PENDIENTE]/docs` |

---

## 🏗️ Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO (Navegador)                │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────┐
│          FRONTEND (GCP Cloud Storage)                │
│        index.html / games.html / login.html          │
│              HTML + CSS + JavaScript                 │
└─────────────────────┬───────────────────────────────┘
                      │ REST API calls
┌─────────────────────▼───────────────────────────────┐
│        BACKEND API (GCP App Engine)                  │
│               FastAPI (Python)                       │
│  /api/games  /api/users  /api/favorites              │
└──────┬──────────────────────────┬───────────────────┘
       │ Consultas SQL             │ HTTP requests
┌──────▼──────────┐    ┌──────────▼──────────────────┐
│  GCP Cloud SQL  │    │    RAWG API (externa)        │
│  PostgreSQL 15  │    │  api.rawg.io/api/games       │
│                 │    │  (fuente de datos inicial)   │
│  - users        │    └─────────────────────────────-┘
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
- PostgreSQL 15 (local o acceso a GCP Cloud SQL)
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/[usuario]/proyecto-desarrollo.git
cd proyecto-desarrollo
```

### 2. Configurar el backend

```bash
cd backend
pip install fastapi uvicorn requests psycopg2-binary python-dotenv bcrypt
```

Crear el archivo `backend/.env`:

```env
RAWG_API_KEY=fc7e8f3dd675402cb10794ff7f2e550a
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

### 5. Abrir el frontend

Abrir `frontend/index.html` directamente en el navegador, o usar Live Server en VSCode.

> **Nota:** Asegúrate de que `API_BASE` en `frontend/js/api.js` apunte a `http://localhost:8000/api` para desarrollo local.

---

## 🚀 Comandos de despliegue en GCP

### Backend en App Engine

```bash
cd backend
gcloud app deploy
```

### Frontend en Cloud Storage

```bash
cd frontend
gsutil -m cp -r . gs://[NOMBRE-DEL-BUCKET]/
gsutil iam ch allUsers:objectViewer gs://[NOMBRE-DEL-BUCKET]
```

### Base de datos Cloud SQL

```bash
# Conectar a la instancia
gcloud sql connect gamehub-db --user=postgres

# Ejecutar el schema
\i database/schema.sql
```

---

## 🔑 Credenciales de prueba

| Campo | Valor |
|---|---|
| Email | `test@gamehub.com` |
| Contraseña | `test123` |

> Estas credenciales se crean ejecutando `database/seed.sql`

---

## 🖼️ Capturas de pantalla

> Agregar capturas después del despliegue final

| Vista | Descripción |
|---|---|
| `screenshots/index.png` | Página principal con juegos populares y nuevos lanzamientos |
| `screenshots/games.png` | Explorador de juegos con búsqueda |
| `screenshots/login.png` | Formulario de inicio de sesión |
| `screenshots/register.png` | Formulario de registro |
| `screenshots/favorites.png` | Lista de juegos favoritos del usuario |

---

## ⚠️ Problemas encontrados y soluciones

| Problema | Solución |
|---|---|
| `ModuleNotFoundError: No module named 'app'` | Ejecutar uvicorn desde dentro de la carpeta `backend/`, no desde la raíz del proyecto |
| Sección `New releases` cortada en el HTML | El hero estaba dentro de `main` con `max-width` limitado; se restructuró el layout con CSS Grid en el header |
| `Connection refused` en PostgreSQL | La BD local no estaba activa; se migró directamente a GCP Cloud SQL |
| Imports incorrectos en Pylance | Las rutas de módulos no coincidían con la estructura real de carpetas (`app.config.database`, `app.services`, `app.models.schemas`) |
| Contraseñas en texto plano | Se implementó encriptación con `bcrypt` en `auth_service.py` |

---

## 📁 Estructura del repositorio

```
proyecto-desarrollo/
├── README.md
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   └── database.py
│   │   ├── controllers/
│   │   │   ├── games_controller.py
│   │   │   ├── users_controller.py
│   │   │   └── favorites_controller.py
│   │   ├── middleware/
│   │   │   └── auth_middleware.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   ├── routes/
│   │   │   ├── games.py
│   │   │   ├── users.py
│   │   │   └── favorites.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── favorites_service.py
│   │   │   └── rawg_service.py
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── toast.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── favorites.js
│   │   ├── games.js
│   │   ├── main.js
│   │   └── toast.js
│   ├── index.html
│   ├── games.html
│   ├── login.html
│   ├── register.html
│   └── favorites.html
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── diagram.png
├── docs/
│   ├── api-documentation.md
│   └── deployment-guide.md
├── screenshots/
└── video/
    └── sustentacion.mp4
```