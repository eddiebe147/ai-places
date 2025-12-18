FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9

# Build stage
FROM base AS builder
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/ws-server ./apps/ws-server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm type-check

# Build ws-server
WORKDIR /app/apps/ws-server
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/apps/ws-server/dist ./dist
COPY --from=builder /app/apps/ws-server/package.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "dist/index.js"]
