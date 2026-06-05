#!/bin/sh
set -eu

# Parsea API_TARGET para extraer scheme y host por separado.
# - API_TARGET=http://localhost:8000  → scheme=http, host=localhost:8000
# - API_TARGET=https://foo.run.app    → scheme=https, host=foo.run.app
# - API_TARGET=localhost:8000         → scheme=http (default), host=localhost:8000
if echo "${API_TARGET:-}" | grep -qE '^https?://'; then
  export API_SCHEME=$(echo "$API_TARGET" | sed -E 's#^(https?)://.*#\1#')
  export API_HOST=$(echo "$API_TARGET" | sed -E 's#^https?://##')
else
  export API_SCHEME=http
  export API_HOST="${API_TARGET:-}"
fi

# Renderiza la plantilla sustituyendo las 3 variables
sed -e "s#\${API_TARGET}#${API_TARGET:-}#g" \
    -e "s#\${API_SCHEME}#${API_SCHEME:-http}#g" \
    -e "s#\${API_HOST}#${API_HOST:-}#g" \
  /etc/prometheus/prometheus.yml.template \
  > /etc/prometheus/prometheus.yml

echo "→ prometheus.yml renderizado:"
echo "   API_TARGET=${API_TARGET:-<empty>}"
echo "   API_SCHEME=${API_SCHEME:-http}"
echo "   API_HOST=${API_HOST:-<empty>}"

exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.enable-lifecycle \
  --web.console.libraries=/usr/share/prometheus/console_libraries \
  --web.console.templates=/usr/share/prometheus/consoles
