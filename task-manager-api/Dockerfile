# syntax=docker/dockerfile:1
# API Express + json-server + routes IA/RAG
FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Dépendances uniquement (couche cacheable)
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY rag ./rag
COPY data ./data

# Utilisateur non-root "haut" (Trivy/K8s) : 10001:10001
RUN addgroup --system --gid 10001 app \
    && adduser --system --uid 10001 --gid 10001 --home /app --shell /usr/sbin/nologin app \
    && chown -R 10001:10001 /app
USER 10001:10001
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/index.js"]
