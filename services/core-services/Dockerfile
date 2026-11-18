# Official Node.js 20 base image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package manifests first to leverage Docker build cache
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/core-services/package.json ./services/core-services/

# Install exact dependencies from lockfile
RUN npm ci

# Copy the rest of the application code
COPY . .

# Compile TypeScript files to JavaScript (dist/)
RUN npm run build --workspace=services/core-services

# Set production environment and document service port
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run compiled Node entrypoint (exec form ensures clean SIGTERM handling)
CMD ["./node_modules/.bin/tsx", "services/core-services/src/index.ts"]