# ── Build stage ─────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN npx prisma generate

COPY . .

RUN pnpm build

# ── Production stage ───────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

# Copy production node_modules from builder (already has everything)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]