#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$MONITORING_DIR/docker-compose.yml"
ENV_FILE="$MONITORING_DIR/.env.prod"

if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  No se encontró $ENV_FILE"
  echo "    Crealo a partir de .env.example con API_TARGET apuntando a GCP, ej.:"
  echo "      cp .env.example .env.prod"
  echo "    Y editá los valores para producción."
  exit 1
fi

# Crea la red externa si GAMEHUB_NETWORK está definida en el env
if grep -qE '^GAMEHUB_NETWORK=.+' "$ENV_FILE"; then
  NETWORK_NAME=$(grep -E '^GAMEHUB_NETWORK=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "$NETWORK_NAME" ] && ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    echo "→ Creando red externa '$NETWORK_NAME'..."
    docker network create "$NETWORK_NAME"
  fi
fi

cd "$MONITORING_DIR"

echo "→ Levantando monitoreo contra producción..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

cat <<'EOF'

✓ Monitoreo levantado contra producción.

   Prometheus   →  http://localhost:9090
   Grafana      →  http://localhost:3000

Verificá los targets en http://localhost:9090/targets
El job 'blackbox_api' debe mostrar todos los endpoints en estado 'UP'.

Para ver logs en vivo:
   docker compose -f monitoring/docker-compose.yml logs -f
EOF
