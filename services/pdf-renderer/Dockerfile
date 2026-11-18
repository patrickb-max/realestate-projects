# Official Node.js 20 base image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package manifests first to leverage Docker build cache
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/pdf-renderer/package.json ./services/pdf-renderer/

# Install exact dependencies from lockfile
RUN npm ci

# Copy remaining source code
COPY . .

# Set production environment and document service port
ENV NODE_ENV=production
ENV PORT=3003
EXPOSE 3003

# Run TypeScript entrypoint directly via tsx
CMD ["./node_modules/.bin/tsx", "services/pdf-renderer/src/index.ts"]
