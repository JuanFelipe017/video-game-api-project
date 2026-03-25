# 🚀 Guía de Despliegue — GameHub en GCP

Esta guía cubre el despliegue completo de GameHub en Google Cloud Platform
usando Cloud Run para frontend y backend, y Cloud SQL para la base de datos.

---

## Requisitos previos

- Cuenta de Google Cloud con facturación activa (free tier disponible)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) instalado y autenticado
- Python 3.10+
- Git
- Docker (para builds locales opcionales)

```bash
# Verificar que gcloud está instalado
gcloud --version

# Autenticarse
gcloud auth login

# Configurar el proyecto
gcloud config set project gamehub-app-490603
```

---

## Paso 1 — Base de datos en Cloud SQL

### 1.1 Crear la instancia PostgreSQL

En la consola de GCP: **Cloud SQL → Crear instancia → PostgreSQL**

| Campo | Valor recomendado |
|---|---|
| ID de instancia | `gamehub-db` |
| Versión | PostgreSQL 15 |
| Región | `us-central1` |
| Tipo de máquina | `db-f1-micro` (free tier) |
| Almacenamiento | 10 GB HDD |

O por CLI:

```bash
gcloud sql instances create gamehub-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

### 1.2 Crear la base de datos y el usuario

```bash
# Crear la base de datos
gcloud sql databases create gamehub --instance=gamehub-db

# Crear usuario
gcloud sql users create gamehub_user \
  --instance=gamehub-db \
  --password=[tu-contraseña]
```

### 1.3 Autorizar IP para acceso externo

En la consola: **Cloud SQL → gamehub-db → Conexiones → Redes autorizadas**

Agrega tu IP pública (búscala en [whatismyip.com](https://whatismyip.com)).

```bash
gcloud sql instances patch gamehub-db \
  --authorized-networks=[TU-IP-PUBLICA]/32
```

### 1.4 Ejecutar el schema

```bash
# Conectar a la instancia
gcloud sql connect gamehub-db --user=postgres

# Dentro de psql, ejecutar el schema
\i database/schema.sql

# Opcional: cargar datos de prueba
\i database/seed.sql
```

---

## Paso 2 — Backend en Cloud Run

### 2.1 Construir y subir la imagen

```bash
# Navegar a la carpeta del backend
cd backend

# Construir y subir la imagen a Artifact Registry
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-backend:latest
```

### 2.2 Desplegar en Cloud Run

```bash
gcloud run deploy gamehub-backend \
  --image us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-backend:latest \
  --region us-central1 \
  --allow-unauthenticated
```

### 2.3 Verificar el despliegue

Abrir en el navegador:
```
https://gamehub-backend-556939640766.us-central1.run.app/
```

Debe mostrar:
```json
{"message": "GameHub API running"}
```

Documentación Swagger disponible en:
```
https://gamehub-backend-556939640766.us-central1.run.app/docs
```

---

## Paso 3 — Frontend en Cloud Run (Astro SSR)

### 3.1 Construir y subir la imagen

```bash
# Navegar a la carpeta del frontend
cd frontend/HUB_GAMES

# Construir y subir la imagen a Artifact Registry
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-front-back:latest
```

### 3.2 Desplegar en Cloud Run

```bash
gcloud run deploy gamehub-front-back \
  --image us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-front-back:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PUBLIC_API_URL=https://gamehub-backend-556939640766.us-central1.run.app,HOST=0.0.0.0
```

### 3.3 Variables de entorno

| Variable | Valor |
|---|---|
| `PUBLIC_API_URL` | `https://gamehub-backend-556939640766.us-central1.run.app` |
| `HOST` | `0.0.0.0` |

---

## Paso 4 — Verificar conectividad

### URLs de acceso

| Componente | URL |
|---|---|
| Frontend | `https://gamehub-front-back-556939640766.us-central1.run.app` |
| Backend API | `https://gamehub-backend-556939640766.us-central1.run.app` |
| Swagger | `https://gamehub-backend-556939640766.us-central1.run.app/docs` |

### Checklist final

- [ ] `GET https://gamehub-backend-.../` devuelve `{"message": "GameHub API running"}`
- [ ] `GET https://gamehub-backend-.../api/games/` devuelve lista de juegos
- [ ] `GET https://gamehub-backend-.../docs` muestra el Swagger
- [ ] El frontend carga sin errores en la consola
- [ ] El login y registro funcionan correctamente
- [ ] Los juegos se muestran en el index y en la página de explorar

### Ver logs

```bash
# Logs del backend
gcloud run services logs read gamehub-backend --region us-central1

# Logs del frontend
gcloud run services logs read gamehub-front-back --region us-central1
```

---

## Actualizar después de cambios

### Actualizar el frontend

```bash
cd frontend/HUB_GAMES
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-front-back:latest
gcloud run deploy gamehub-front-back \
  --image us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-front-back:latest \
  --region us-central1
```

### Actualizar el backend

```bash
cd backend
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-backend:latest
gcloud run deploy gamehub-backend \
  --image us-central1-docker.pkg.dev/gamehub-app-490603/cloud-run-source-deploy/gamehub-backend:latest \
  --region us-central1
```

---

## Solución de problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `Connection refused` en PostgreSQL | IP no autorizada en Cloud SQL | Agregar la IP del Cloud Run en "Redes autorizadas" |
| `CORS error` en el frontend | Backend no permite el origen | Verificar `allow_origins` en `main.py` |
| `Mixed Content` en el navegador | URL del backend en `http` en lugar de `https` | Verificar `PUBLIC_API_URL` en las variables de entorno |
| `Module not found` al desplegar | Falta dependencia en `requirements.txt` | Agregar el módulo faltante y redesplegar |
| `502 Bad Gateway` | Error en el startup del servidor | Revisar logs con `gcloud run services logs read` |
| Frontend no carga datos | `PUBLIC_API_URL` no configurada | Verificar variables de entorno en Cloud Run |

---

## Costos estimados (free tier)

| Servicio | Free tier | Costo estimado |
|---|---|---|
| Cloud SQL (db-f1-micro) | No incluido en free tier | ~$7-10 USD/mes |
| Cloud Run (frontend) | 2M requests/mes gratis | $0 en uso normal |
| Cloud Run (backend) | 2M requests/mes gratis | $0 en uso normal |
| Artifact Registry | 0.5 GB gratis | $0 para imágenes pequeñas |

> **Recomendación:** Apagar la instancia de Cloud SQL cuando no se esté usando para evitar cargos.
> ```bash
> gcloud sql instances patch gamehub-db --activation-policy=NEVER
> ```