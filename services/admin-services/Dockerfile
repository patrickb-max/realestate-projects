# ---- Stage 1: Install Workspace Dependencies ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/constants/package.json ./packages/constants/
COPY database/package.json ./database/
COPY services/admin-services/package.json ./services/admin-services/

RUN npm ci --omit=dev --workspace=@reprojects/admin-services --include-workspace-root

# ---- Stage 2: Minimal Production Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY packages/constants ./packages/constants
COPY database ./database
COPY services/admin-services ./services/admin-services

USER node

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/health || exit 1

CMD ["npm", "run", "start", "--workspace=@reprojects/admin-services"]
