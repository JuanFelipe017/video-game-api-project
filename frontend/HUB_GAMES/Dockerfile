# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero (mejor cache)
COPY package*.json ./
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Build de Astro
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar solo lo necesario del build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Cloud Run usa la variable PORT (por defecto 8080)
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["node", "./dist/server/entry.mjs"]