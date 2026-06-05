#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$MONITORING_DIR/.env"

cd "$MONITORING_DIR"

# Crea la red externa si no existe
if ! docker network inspect gamehub-net >/dev/null 2>&1; then
  echo "→ Creando red externa 'gamehub-net'..."
  docker network create gamehub-net
fi

# Carga el .env de local
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  No se encontró $ENV_FILE — copiá .env.example a .env primero:"
  echo "    cp .env.example .env"
  exit 1
fi

# Lanza el stack
echo "→ Levantando microservicio de monitoreo..."
docker compose --env-file "$ENV_FILE" up -d

cat <<'EOF'

✓ Microservicio de monitoreo levantado.

   Prometheus   →  http://localhost:9090
   Grafana      →  http://localhost:3000   (admin / admin)
   Blackbox     →  http://localhost:9115

Para verificar que todo scrapea OK:
   curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job:.labels.job, health:.health}'

Para generar tráfico hacia la API:
   python "prometeus & grafana/generate_traffic.py"
EOF
