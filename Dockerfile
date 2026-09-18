FROM node:20-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Pin npm to match the version package-lock.json was generated with —
# older/newer npm resolves the dependency tree differently and npm ci
# rejects the mismatch.
RUN npm install -g npm@11.6.2

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Generate prisma client & build
RUN npx prisma generate
RUN npm run build

# Step 2. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Migrations run at container start, once the DB (docker-compose "db"
# service) is actually reachable — not at build time, when it isn't.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
