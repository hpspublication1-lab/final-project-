# SAMYAK MULTIPLAYER — PRODUCTION DEPLOYMENT RUNBOOK
**Document Version:** 1.0.0-DEPLOY  
**Scope:** Production & Staging Deployment Guide for Colyseus Multiplayer Service  
**Date:** November 10, 2026  
**DevOps Engineer:** Lead DevOps & SRE Engineer  

---

## 1. Pre-Deployment Readiness Checklist

Before initiating production deployment, ensure the following prerequisites are met:
- [x] All 69 Vitest unit and security tests pass without warnings.
- [x] TypeScript compiler check (`npx tsc --noEmit`) completes with 0 errors.
- [x] Database migration `20261110000001_multiplayer_security_hardening.sql` applied to Supabase.
- [x] Environment secrets populated in production secret vaults (Vercel & VM).
- [x] Cloudflare SSL and WebSocket streaming enabled for `arena-ws.samyakcee.com`.

---

## 2. Docker & Containerized Service Setup

Create a `Dockerfile` inside `services/multiplayer/Dockerfile`:

```dockerfile
# Multi-stage production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 2567
USER node
CMD ["node", "dist/index.js"]
```

### Docker Compose Configuration (`docker-compose.prod.yml`):
```yaml
version: '3.8'

services:
  colyseus-primary:
    build:
      context: ./services/multiplayer
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "2567:2567"
    environment:
      - NODE_ENV=production
      - PORT=2567
      - HOST=0.0.0.0
      - MULTIPLAYER_SECRET_KEY=${MULTIPLAYER_SECRET_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=${REDIS_URL}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:2567/health"]
      interval: 10s
      timeout: 3s
      retries: 3
```

---

## 3. Reverse Proxy Configuration (Nginx / Cloudflare)

Configure Nginx reverse proxy with WebSocket upgrade support:

```nginx
upstream colyseus_nodes {
    ip_hash; # Sticky session affinity for reconnection resilience
    server 127.0.0.1:2567;
}

server {
    listen 80;
    server_name arena-ws.samyakcee.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name arena-ws.samyakcee.com;

    ssl_certificate /etc/letsencrypt/live/arena-ws.samyakcee.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arena-ws.samyakcee.com/privkey.pem;

    location /health {
        proxy_pass http://colyseus_nodes/health;
        proxy_http_version 1.1;
    }

    location / {
        proxy_pass http://colyseus_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

---

## 4. Zero-Downtime Rolling Update Instructions

The Colyseus service includes built-in signal listeners for `SIGINT` and `SIGTERM`.

When a deployment update occurs:
1. Orchestrator sends `SIGTERM` to the old process.
2. The server marks all rooms as draining: no new match joins are accepted.
3. Active quiz rooms are allowed up to 60 seconds to finalize existing questions and settle results.
4. Once active rooms reach zero, the old process exits cleanly with status 0.
5. Zero matches are truncated or abruptly lost during deployment.
