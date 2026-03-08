ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ─── Production image ───────────────────────────────────────────────
FROM node:${NODE_VERSION}-slim

WORKDIR /app

# Copy built output and production node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /data
VOLUME /data

ENV NODE_ENV=production
ENV PORT=3000

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
ENV DATABASE_URL="/data/db.sqlite"
CMD ["node", "build"]
