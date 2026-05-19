## --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Ejecuta lint antes del build para evitar errores de TypeScript
RUN npm run lint
RUN npm run build

## --- Stage 2: Serve ---
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
COPY public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
