# syntax=docker/dockerfile:1

# ---- Base Node image ----
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---- Prisma Generate ----
FROM deps AS prisma
COPY prisma ./prisma/
COPY prisma.config.ts ./
# Dummy URL for generate (doesn't connect, just generates client)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# ---- Builder ----
FROM base AS builder
COPY --from=prisma /app/node_modules ./node_modules
COPY . .

# Dummy URL for build (Next.js may reference Prisma during build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production

# Timezone database so named zones (e.g. TZ=America/Los_Angeles) resolve;
# alpine has no tzdata by default and would otherwise fall back to UTC.
RUN apk add --no-cache tzdata

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma for migrations (optional - can be removed if migrations run separately)
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

# One-off maintenance scripts (e.g. the Member Points backfill), so they can be
# run with `kubectl exec` against the live deployment. See helm/README.md.
# points-config.ts comes along because the backfill reads the award values out
# of it rather than hardcoding a second copy of them.
COPY scripts ./scripts/
COPY lib/points-config.ts ./lib/points-config.ts

# Prisma CLI, pinned to the client version, so the migration init container
# (see helm deployment.yaml) can run `prisma db push` on pod start without
# fetching it from the network every time.
RUN npm i -g prisma@6.19.3 --no-fund --no-audit && npm cache clean --force

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
