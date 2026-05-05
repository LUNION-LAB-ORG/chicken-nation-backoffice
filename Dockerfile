# ============================================================================
# Chicken Nation Backoffice — multi-stage Dockerfile (Next.js 15 + Bun)
#
# Strategy:
#  - Bun for build (fast TS + Next.js)
#  - Bun-slim runtime + Chromium for Puppeteer (server-side PDF generation)
#
# NEXT_PUBLIC_* vars MUST be passed as build ARGs because Next.js inlines them
# into the JavaScript bundle at build time (not runtime).
#
# Build:
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.chicken-nation.com \
#     --build-arg NEXT_PUBLIC_API_PREFIX=/api/v1 \
#     --build-arg NEXT_PUBLIC_CLOUDFRONT_URL=https://dvsxt5681pvqm.cloudfront.net \
#     --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=... \
#     --build-arg NEXT_PUBLIC_ONESIGNAL_APP_ID=... \
#     -t chicken-nation-backoffice:latest .
# ============================================================================

# ---------- Dependencies ----------
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- Build ----------
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* injected as build ARGs (inlined in bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_PREFIX
ARG NEXT_PUBLIC_CLOUDFRONT_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_ONESIGNAL_APP_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_API_PREFIX=$NEXT_PUBLIC_API_PREFIX \
    NEXT_PUBLIC_CLOUDFRONT_URL=$NEXT_PUBLIC_CLOUDFRONT_URL \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_ONESIGNAL_APP_ID=$NEXT_PUBLIC_ONESIGNAL_APP_ID \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN bun run build

# ---------- Runtime ----------
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Chromium for Puppeteer (server-side PDF generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
        chromium \
        fonts-liberation \
        libgbm1 \
        libnss3 \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy built artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./

EXPOSE 3000

CMD ["bun", "run", "start"]
