FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/workers/package.json ./apps/workers/
COPY packages/db/package.json ./packages/db/

RUN pnpm install

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/workers/node_modules ./apps/workers/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules

COPY packages/db ./packages/db
COPY apps/workers ./apps/workers

WORKDIR /app/apps/workers

CMD ["pnpm", "tsx", "src/job-runner.ts"]
