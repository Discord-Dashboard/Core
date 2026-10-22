# Build and run the standalone dashboard server.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @asctane-dashboard/server... build

FROM base AS run
COPY --from=deps /app /app
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/server/dist/main.js"]
