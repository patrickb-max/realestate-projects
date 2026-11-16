# ---- Stage 1: Install Workspace Dependencies ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root and workspace package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./
COPY packages/constants/package.json ./packages/constants/
COPY packages/types/package.json ./packages/types/
COPY packages/domain/package.json ./packages/domain/
COPY packages/validators/package.json ./packages/validators/
COPY database/package.json ./database/
COPY services/core-services/package.json ./services/core-services/

# Install only production dependencies for core-services and its local workspace packages
RUN npm ci --omit=dev --workspace=@reprojects/core-services --include-workspace-root

# ---- Stage 2: Minimal Production Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules and workspace source code
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY packages ./packages
COPY database ./database
COPY services/core-services ./services/core-services

# Drop root privileges for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# Run the core-services application
CMD ["npm", "run", "start", "--workspace=@reprojects/core-services"]
