# Multi-stage Dockerfile prod pour le front help-selfizee.
# Stage 1 : Vite build (les VITE_* sont inline dans le bundle à ce moment).
# Stage 2 : nginx sert les fichiers statiques + fallback SPA sur index.html.

# ---------- Stage 1 : build Vite ----------
FROM node:22-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Les VITE_* doivent être passées en build args / env pour être inline
# dans le bundle JavaScript final.
ARG VITE_API_BASE_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

RUN pnpm build

# ---------- Stage 2 : nginx ----------
FROM nginx:1.27-alpine AS runtime

# Conf nginx custom : fallback SPA + proxy /api -> back
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Le build Vite sort dans /app/dist (cf. vite.config.ts par défaut)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
