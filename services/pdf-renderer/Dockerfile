FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/pdf-renderer/package.json ./services/pdf-renderer/
RUN npm ci
COPY . .
RUN npm run build --workspace=services/pdf-renderer

FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf --no-install-recommends && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3004
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY --chown=node:node package.json package-lock.json tsconfig.json ./
COPY --chown=node:node packages/ ./packages/
COPY --chown=node:node services/pdf-renderer/package.json ./services/pdf-renderer/
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node services/pdf-renderer/src ./services/pdf-renderer/src
USER node
EXPOSE 3004
CMD ["./node_modules/.bin/tsx", "services/pdf-renderer/src/index.ts"]