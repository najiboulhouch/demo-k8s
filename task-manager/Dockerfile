# syntax=docker/dockerfile:1
# Build Angular (prod) puis sert les fichiers statiques avec nginx non-root
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

COPY angular.json tsconfig*.json ./
COPY public ./public
COPY src ./src

# URL de l’API vue par le navigateur (ex. même origine derrière Traefik, ou nom de service Compose)
# URL atteignable depuis le navigateur (pas le nom DNS interne Docker, sauf si même origine / proxy).
ARG API_BASE_URL=http://localhost:3000
# Un seul RUN (Hadolint DL3059) : build + copie des assets statiques.
RUN sed -i "s#__API_BASE_URL__#${API_BASE_URL}#g" src/environments/environment.docker.ts \
    && npm run build -- --configuration=docker --no-progress \
    && mkdir -p /app/static-html \
    && if [ -d /app/dist/task-manager/browser ]; then \
         cp -a /app/dist/task-manager/browser/. /app/static-html/; \
       else \
         cp -a /app/dist/task-manager/. /app/static-html/; \
       fi

# Alpine + nginx paquet (évite les couches nginxinc où Dockle signale KEY_SHA512 — checksum de clé publique, pas un secret).
FROM alpine:3.21 AS runner
# Version épinglée (Hadolint DL3018) — vérifier sur https://pkgs.alpinelinux.org (branche v3.21) lors des mises à jour mineures d’Alpine.
RUN apk add --no-cache nginx=1.26.3-r0 \
    && rm -rf /etc/nginx/http.d/* /etc/nginx/conf.d/*

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/static-html/ /usr/share/nginx/html/
# Répertoires temporaires nginx (non-root) — même logique que dans nginx.conf (/tmp/...)
RUN mkdir -p /tmp/nginx-client-body /tmp/nginx-proxy /tmp/nginx-fastcgi /tmp/nginx-uwsgi /tmp/nginx-scgi \
    && chown -R nginx:nginx /usr/share/nginx/html /tmp/nginx-client-body /tmp/nginx-proxy \
       /tmp/nginx-fastcgi /tmp/nginx-uwsgi /tmp/nginx-scgi

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
