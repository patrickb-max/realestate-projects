FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY database/package.json ./database/
COPY services/admin-services/package.json ./services/admin-services/
RUN npm ci
COPY . .
RUN npm run build --workspace=services/admin-services

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
COPY --chown=node:node package.json package-lock.json tsconfig.json ./
COPY --chown=node:node packages/ ./packages/
COPY --chown=node:node database/package.json ./database/
COPY --chown=node:node services/admin-services/package.json ./services/admin-services/
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node database/src ./database/src
COPY --chown=node:node services/admin-services/src ./services/admin-services/src
USER node
EXPOSE 3002
CMD ["./node_modules/.bin/tsx", "services/admin-services/src/index.ts"]
