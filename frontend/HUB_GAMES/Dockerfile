FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV PUBLIC_API_URL=https://gamehub-backend-556939640766.us-central1.run.app
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]