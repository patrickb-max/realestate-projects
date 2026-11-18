FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY database/package.json ./database/
COPY services/core-services/package.json ./services/core-services/
RUN npm ci
COPY . .
RUN npm run build --workspace=services/core-services

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --chown=node:node package.json package-lock.json tsconfig.json ./
COPY --chown=node:node packages/ ./packages/
COPY --chown=node:node database/package.json ./database/
COPY --chown=node:node services/core-services/package.json ./services/core-services/
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node database/src ./database/src
COPY --chown=node:node services/core-services/src ./services/core-services/src
USER node
EXPOSE 3000
CMD ["./node_modules/.bin/tsx", "services/core-services/src/index.ts"]
