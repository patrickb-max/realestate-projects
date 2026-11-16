# ---- Stage 1: Install Workspace Dependencies ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/constants/package.json ./packages/constants/
COPY services/pdf-renderer/package.json ./services/pdf-renderer/

RUN npm ci --omit=dev --workspace=@reprojects/pdf-renderer --include-workspace-root

# ---- Stage 2: Minimal Production Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3003

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY packages/constants ./packages/constants
COPY services/pdf-renderer ./services/pdf-renderer

USER node

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3003/health || exit 1

CMD ["npm", "run", "start", "--workspace=@reprojects/pdf-renderer"]
