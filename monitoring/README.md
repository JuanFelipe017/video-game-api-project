# GameHub Monitoring Microservice

Microservicio de observabilidad para la API de GameHub. Combina dos enfoques:

- **Black-box** (`blackbox-exporter`) — prueba la API desde afuera, sin tocarla. Mide disponibilidad, latencia externa y status codes.
- **White-box** (`prometheus-fastapi-instrumentator` en la API) — scrapea `/metrics` que la propia API expone. Mide RPS, latencia interna, requests en curso, excepciones.

Las dos se ven en el mismo dashboard de Grafana.

## Stack

- **Prometheus** — motor de series temporales y PromQL
- **Grafana** — visualización (dashboard con 13 paneles)
- **blackbox-exporter** — pruebas HTTP desde afuera

> **Networking:** los 3 servicios corren con `network_mode: host` (no en una red Docker bridge) para que blackbox pueda llegar a la API cuando corre en `localhost:8000` del host sin problemas de enrutamiento. Para producción apuntás `API_TARGET` al URL público y todo sigue igual.

## Estructura

```
monitoring/
├── docker-compose.yml              # 3 servicios en network_mode: host
├── prometheus.yml.template         # Jobs: prometheus, blackbox_api, gamehub_api
├── blackbox.yml                    # Módulo http_gamehub_api (probes HTTP)
├── .env.example                    # Plantilla de variables
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml
│   │   └── dashboards/dashboards.yml
│   └── dashboards/
│       └── gamehub-blackbox.json   # 14 paneles (blackbox + whitebox)
└── scripts/
    ├── prometheus-entrypoint.sh    # Renderiza el template con sed
    ├── start-local.sh              # Arranca con .env
    ├── start-prod.sh               # Arranca con .env.prod
    └── generate_traffic.py         # Genera tráfico de prueba contra la API
```

## Caso 1 — Monitorear la API local (uvicorn directo en tu PC)

### 1. Asegurate de que tu API esté corriendo con `--host 0.0.0.0`

```bash
cd backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

> ⚠️ Si lo dejás en `127.0.0.1`, blackbox no llega. Verificá con `ss -tlnp | grep 8000` — tiene que decir `0.0.0.0:8000`.

### 2. Verificá que `/metrics` está expuesto

```bash
curl -s http://localhost:8000/metrics | head -5
# esperado: líneas tipo http_requests_total, http_request_duration_seconds...
```

### 3. Configurar `.env`

```bash
cd monitoring
cp .env.example .env
# Por defecto API_TARGET=http://localhost:8000 (no tocar)
```

### 4. Levantar el stack

```bash
./scripts/start-local.sh
```

### 5. Verificar

| URL | Qué ver |
|---|---|
| http://localhost:9090/targets | Los 3 jobs `UP`: `prometheus`, `blackbox_api` (6 endpoints), `gamehub_api` |
| http://localhost:9090/graph | Probar queries PromQL |
| http://localhost:3000 | Dashboard Grafana con 13 paneles (admin/admin) |
| http://localhost:9115 | Métricas crudas de blackbox |

### 6. Generar tráfico

```bash
python monitoring/scripts/generate_traffic.py --requests 100
```

## Caso 2 — Monitorear la API de producción (Cloud Run) desde tu PC

Hay 2 pasos: **(a) subir `/metrics` al server** y **(b) apuntar el monitoreo local al server**.

### (a) Subir `/metrics` al backend en Cloud Run

El backend en `gamehub-backend` ya tiene `prometheus-fastapi-instrumentator` integrado (ver `backend/app/main.py`). Solo falta re-desplegarlo:

```bash
git add backend/app/main.py backend/requirements.txt
git commit -m "feat: add /metrics endpoint via prometheus-fastapi-instrumentator"
git push origin main
```

GitHub Actions (`.github/workflows/cd.yml`) detecta el push y corre `google-github-actions/deploy-cloudrun@v1` automáticamente. Esperá 2-5 min y verificá:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://gamehub-backend-556939640766.us-central1.run.app/metrics
# esperado: 200
```

Si la CI no está habilitada o querés forzar el deploy:

```bash
gcloud run deploy gamehub-backend \
  --source ./backend \
  --region us-central1
```

### (b) Apuntar el monitoreo local a Cloud Run

```bash
cd monitoring
cp .env.example .env.prod
```

Editá `.env.prod`:

```bash
API_TARGET=https://gamehub-backend-556939640766.us-central1.run.app
GF_ADMIN_USER=admin
GF_ADMIN_PASSWORD=<contraseña-fuerte>
```

Levantá el stack:

```bash
./scripts/start-prod.sh
```

El script usa `--env-file .env.prod` automáticamente. Verificá en http://localhost:9090/targets que tanto `blackbox_api` (probando URLs HTTPS) como `gamehub_api` (scrapeando `/metrics`) estén en `UP`.

> 💡 **Tip de costo:** Cloud Run cobra por CPU/memoria, no por request. El scrape cada 10s no genera cargo extra, pero si ves muchos cold starts subí el `scrape_interval` a 30s o 60s en `prometheus.yml.template`.

## Caso 3 — Deployar TODO el stack a un servidor (Prometheus + Grafana remoto)

Si querés que el monitoreo corra en una VM y no en tu PC (ej. para que sobreviva a que cierres la laptop), el flujo es el mismo `start-prod.sh` pero apuntando a un `.env.prod` con la URL de Cloud Run.

### 1. Levantar una VM

```bash
gcloud compute instances create gamehub-monitor \
  --machine-type=e2-small \
  --zone=us-central1-a \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

### 2. Instalar Docker y clonar

```bash
gcloud compute ssh gamehub-monitor -- <<'EOF'
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  exit
EOF

gcloud compute ssh gamehub-monitor -- tmux new -d -s monitor '
  git clone <repo-url> gamehub && cd gamehub/monitoring
  cp .env.example .env.prod
  # editar .env.prod con API_TARGET=https://gamehub-backend-...run.app
  ./scripts/start-prod.sh
'
```

### 3. Exponer los puertos (recomendado: tunnel SSH)

```bash
gcloud compute ssh gamehub-monitor -- -L 3000:localhost:3000 -L 9090:localhost:9090
```

Después abrís `http://localhost:3000` en tu navegador local. Para HTTPS público, poner un reverse proxy con nginx + Let's Encrypt adelante (no incluido acá).

## Configuración

### Variables de entorno (`.env` / `.env.prod`)

| Variable | Default | Descripción |
|---|---|---|
| `API_TARGET` | `http://localhost:8000` | URL base de la API (sin `/metrics` ni `/probe`) |
| `GF_ADMIN_USER` | `admin` | Usuario de Grafana |
| `GF_ADMIN_PASSWORD` | `admin` | Password de Grafana |

### Endpoints que blackbox prueba

Definidos en `prometheus.yml.template`, editables sin recompilar:

- `${API_TARGET}/`
- `${API_TARGET}/api/games/`
- `${API_TARGET}/api/games/1`
- `${API_TARGET}/api/games/new-releases`
- `${API_TARGET}/api/games/?page=1&page_size=10`
- `${API_TARGET}/api/users/`

Para agregar más, editá la lista de `targets:` y reiniciá Prometheus:

```bash
docker compose -f monitoring/docker-compose.yml restart prometheus
```

## Métricas disponibles

### Black-box (`probe_*`)

| Métrica | Tipo | Descripción |
|---|---|---|
| `probe_success` | gauge | 1 si el probe pasó, 0 si falló |
| `probe_duration_seconds` | gauge | Duración total del probe (usar `quantile_over_time` para percentiles) |
| `probe_http_status_code` | gauge | Status code HTTP de la respuesta |
| `probe_failed_due_to_regex` | gauge | 1 si el body matcheó un regex de error |
| `probe_ip_protocol` | gauge | 4 = IPv4, 6 = IPv6 |
| `probe_ssl_earliest_cert_expiry` | gauge | Timestamp de expiración del cert TLS (en prod HTTPS) |

### White-box (`http_*`)

| Métrica | Tipo | Descripción |
|---|---|---|
| `http_requests_total` | counter | Requests acumuladas, labels: `method`, `handler`, `status` |
| `http_request_duration_seconds_bucket` | histogram | Latencia en buckets, usar `histogram_quantile()` para p50/p95/p99 |
| `http_request_duration_seconds_sum/count` | counter | Para latencia promedio |
| `http_requests_in_progress` | gauge | Requests siendo procesados ahora mismo |
| `http_requests_exceptions_total` | counter | Excepciones no manejadas |
| `http_request_size_bytes` | summary | Tamaño de request |
| `http_response_size_bytes` | summary | Tamaño de response |

## Queries PromQL útiles

```promql
# RPS total
sum(rate(http_requests_total[1m]))

# RPS por endpoint
sum by (handler) (rate(http_requests_total[1m]))

# Latencia p95 global
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# Latencia p95 por endpoint
histogram_quantile(0.95, sum by (handler, le) (rate(http_request_duration_seconds_bucket[5m])))

# Tasa de errores 5xx
sum(rate(http_requests_total{status="5xx"}[5m]))

# Ratio de error (%)
100 * sum(rate(http_requests_total{status=~"4..|5.."}[5m]))
    / sum(rate(http_requests_total[5m]))

# Uptime visto por blackbox (%)
100 * avg(avg_over_time(probe_success[5m]))

# Latencia p95 vista por blackbox (%)
quantile_over_time(0.95, probe_duration_seconds[5m])

# Top 5 endpoints con más tráfico
topk(5, sum by (handler) (rate(http_requests_total[5m])))

# Requests en vivo
sum(http_requests_in_progress)
```

## Troubleshooting

### `probe_success` siempre 0 en local
Tu uvicorn está en loopback. Verificá:
```bash
ss -tlnp | grep ":8000"
```
Tiene que decir `0.0.0.0:8000`, no `127.0.0.1:8000`. Si dice 127.0.0.1, reiniciá con `--host 0.0.0.0`.

### `/metrics` da 404 en Cloud Run
La imagen desplegada no tiene `prometheus-fastapi-instrumentator`. Re-despliegá el backend siguiendo el Caso 2(a).

### Targets en `DOWN` después de cambiar `API_TARGET`
```bash
docker compose -f monitoring/docker-compose.yml restart prometheus
```

### Paneles de Grafana vacíos
1. Verificá targets en http://localhost:9090/targets.
2. Si están `UP` pero Grafana no muestra: `docker logs gamehub_grafana | tail -50`.
3. Prometheus tarda ~15s en el primer scrape.

### "Endpoint returns 405" en logs de blackbox
El endpoint existe pero no soporta GET. Soluciones:
- Quitarlo de los `targets:` en `prometheus.yml.template`.
- O agregarlo a `valid_status_codes` en `blackbox.yml`.

### Borrar todas las métricas acumuladas
```bash
cd monitoring
docker compose --env-file .env down
docker volume rm monitoring_prometheus_data
docker compose --env-file .env up -d
```

## Próximos pasos (cuando los necesites)

- **Alertas**: agregar `alertmanager` y un `rule_files:` con reglas tipo "5xx rate > 1/s por 2 min", "p95 > 1.5s por 5 min", "probe_success == 0 por 2 min".
- **Métricas de DB**: sumar `prom/postgres-exporter` al compose y un job nuevo en Prometheus.
- **Persistencia del stack de monitoreo**: pasar de `network_mode: host` a una red Docker propia si lo deployás a Kubernetes/ECS.
- **HTTPS en Grafana**: hoy está sin TLS, en prod real poner nginx + Let's Encrypt adelante.
