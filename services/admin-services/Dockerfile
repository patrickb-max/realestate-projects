# Official Node.js 20 base image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package manifests first to leverage Docker build cache
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/admin-services/package.json ./services/admin-services/

# Install exact dependencies from lockfile
RUN npm ci

# Copy remaining source code
COPY . .

# Set production environment and document service port
ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

# Run TypeScript entrypoint directly via tsx
CMD ["./node_modules/.bin/tsx", "services/admin-services/src/index.ts"]
