# Multi-stage build for production-grade optimization
# Stage 1: Build dependencies and generate Prisma Client
FROM oven/bun:1.1.8-alpine AS builder

WORKDIR /usr/src/app

# Copy lock and packages configuration
COPY package.json bun.lockb ./
COPY prisma ./prisma/

# Install runtime and build dependencies
RUN bun install --frozen-lockfile

# Generate Prisma Client
RUN bunx prisma generate

# Copy application source code
COPY src ./src
COPY tsconfig.json ./

# Stage 2: Runtime image
FROM oven/bun:1.1.8-alpine AS runner

WORKDIR /usr/src/app

# Copy node_modules and configuration from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/tsconfig.json ./tsconfig.json

# Expose server port
EXPOSE 4000

ENV NODE_ENV=production

# Run database migrations and start server
CMD ["bun", "run", "src/server.ts"]
