# --- Stage 1: Build the Vite app ---
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .

# Pass API key into the build so Vite can inline it
ARG VITE_API_KEY=""
ENV VITE_API_KEY=${VITE_API_KEY}

RUN npm run build

# --- Stage 2: Serve with nginx ---
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
