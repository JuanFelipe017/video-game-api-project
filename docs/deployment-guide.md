# 🚀 Guía de Despliegue — GameHub en GCP

Esta guía cubre el despliegue completo de GameHub en Google Cloud Platform:
base de datos en Cloud SQL, backend en App Engine y frontend en Cloud Storage.

---

## Requisitos previos

- Cuenta de Google Cloud con facturación activa (free tier disponible)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) instalado y autenticado
- Python 3.10+
- Git

```bash
# Verificar que gcloud está instalado
gcloud --version

# Autenticarse
gcloud auth login

# Configurar el proyecto
gcloud config set project [ID-DEL-PROYECTO]
```

---

## Paso 1 — Crear la base de datos en Cloud SQL

### 1.1 Crear la instancia PostgreSQL

En la consola de GCP: **Cloud SQL → Crear instancia → PostgreSQL**

| Campo | Valor recomendado |
|---|---|
| ID de instancia | `gamehub-db` |
| Versión | PostgreSQL 15 |
| Región | `us-central1` |
| Tipo de máquina | `db-f1-micro` (free tier) |
| Almacenamiento | 10 GB HDD |
| Contraseña root | [tu contraseña segura] |

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

### 1.3 Autorizar tu IP para acceso externo

En la consola: **Cloud SQL → gamehub-db → Conexiones → Redes autorizadas**

Agrega tu IP pública (búscala en [whatismyip.com](https://whatismyip.com)).

O por CLI:
```bash
gcloud sql instances patch gamehub-db \
  --authorized-networks=[TU-IP-PUBLICA]/32
```

### 1.4 Ejecutar el schema

```bash
# Conectar a la instancia
gcloud sql connect gamehub-db --user=gamehub_user --database=gamehub

# Dentro de psql, ejecutar el schema
\i database/schema.sql

# Opcional: cargar datos de prueba
\i database/seed.sql
```

---

## Paso 2 — Desplegar el backend en App Engine

### 2.1 Crear el archivo `app.yaml`

Crear `backend/app.yaml`:

```yaml
runtime: python313

entrypoint: uvicorn app.main:app --host 0.0.0.0 --port $PORT

env_variables:
  RAWG_API_KEY: "fc7e8f3dd675402cb10794ff7f2e550a"
  PGHOST: "[IP-PUBLICA-DE-TU-INSTANCIA-CLOUD-SQL]"
  PGPORT: "5432"
  PGUSER: "gamehub_user"
  PGPASSWORD: "[tu-contraseña]"
  PGDATABASE: "gamehub"
```

> **Importante:** La IP pública de tu instancia Cloud SQL la encuentras en
> **Cloud SQL → gamehub-db → Descripción general → IP pública**

### 2.2 Crear `requirements.txt`

Crear `backend/requirements.txt`:

```
fastapi
uvicorn
requests
psycopg2-binary
python-dotenv
bcrypt
```

### 2.3 Desplegar

```bash
cd backend
gcloud app deploy
```

Confirmar con `Y` cuando lo solicite. El proceso tarda unos 3-5 minutos.

### 2.4 Verificar el despliegue

```bash
gcloud app browse
```

Debe abrir el navegador en la URL de App Engine y mostrar:
```json
{"message": "GameHub API running"}
```

La URL del backend tendrá el formato:
```
https://[ID-DEL-PROYECTO].uc.r.appspot.com
```

---

## Paso 3 — Desplegar el frontend en Cloud Storage

### 3.1 Crear el bucket

```bash
gsutil mb -l us-central1 gs://gamehub-frontend-[ID-DEL-PROYECTO]
```

### 3.2 Actualizar la URL del backend en `api.js`

Antes de subir el frontend, editar `frontend/js/api.js` y cambiar:

```javascript
// Cambiar esto:
const API_BASE = "http://localhost:8000/api";

// Por la URL real de App Engine:
const API_BASE = "https://[ID-DEL-PROYECTO].uc.r.appspot.com/api";
```

### 3.3 Subir los archivos

```bash
cd frontend
gsutil -m cp -r . gs://gamehub-frontend-[ID-DEL-PROYECTO]/
```

### 3.4 Hacer el bucket público

```bash
gsutil iam ch allUsers:objectViewer gs://gamehub-frontend-[ID-DEL-PROYECTO]
```

### 3.5 Configurar como sitio web estático

```bash
gsutil web set -m index.html -e index.html \
  gs://gamehub-frontend-[ID-DEL-PROYECTO]
```

La URL del frontend tendrá el formato:
```
https://storage.googleapis.com/gamehub-frontend-[ID-DEL-PROYECTO]/index.html
```

---

## Paso 4 — Verificar conectividad

### Checklist final

- [ ] `GET https://[backend-url]/` devuelve `{"message": "GameHub API running"}`
- [ ] `GET https://[backend-url]/api/games/` devuelve lista de juegos
- [ ] `GET https://[backend-url]/docs` muestra el Swagger
- [ ] El frontend carga en el navegador sin errores en la consola
- [ ] El login y registro funcionan correctamente
- [ ] Los juegos se muestran en el index y en games.html

### Ver logs del backend

```bash
gcloud app logs tail -s default
```

---

## Solución de problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `Connection refused` en PostgreSQL | IP no autorizada en Cloud SQL | Agregar la IP del App Engine en "Redes autorizadas" |
| `CORS error` en el frontend | Backend no permite el origen | Verificar `allow_origins` en `main.py` |
| `Module not found` al desplegar | Falta dependencia en `requirements.txt` | Agregar el módulo faltante y volver a desplegar |
| Frontend no carga datos | `API_BASE` apunta a localhost | Actualizar `api.js` con la URL real de App Engine |
| `502 Bad Gateway` en App Engine | Error en el startup de uvicorn | Revisar logs con `gcloud app logs tail` |

---

## Costos estimados (free tier)

| Servicio | Free tier | Costo estimado |
|---|---|---|
| Cloud SQL (db-f1-micro) | No incluido en free tier | ~$7-10 USD/mes |
| App Engine (F1) | 28 horas-instancia/día gratis | $0 en uso normal |
| Cloud Storage | 5 GB gratis | $0 para frontend estático |

> **Recomendación:** Apagar la instancia de Cloud SQL cuando no se esté usando para evitar cargos.
> ```bash
> gcloud sql instances patch gamehub-db --activation-policy=NEVER
> ```