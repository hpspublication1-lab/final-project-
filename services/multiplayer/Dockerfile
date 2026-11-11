# ==============================================================================
# SAMYAK CEE — COLYSEUS MULTIPLAYER SERVICE PRODUCTION DOCKERFILE
# Multi-stage lightweight build targeting Node.js 20 Alpine Linux
# ==============================================================================

# ---- Stage 1: Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy TypeScript source code
COPY src/ ./src/

# Compile TypeScript to dist/
RUN npm run build

# ---- Stage 2: Production runtime stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2567
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security compliance
USER node

# Expose Colyseus WebSocket and Health Check port
EXPOSE 2567

# Healthcheck endpoint
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:2567/health || exit 1

# Start daemon
CMD ["node", "dist/index.js"]
