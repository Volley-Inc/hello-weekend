FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=secret,id=npm_token NPM_TOKEN=$(cat /run/secrets/npm_token) pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter=@hello-weekend/shared build && pnpm --filter=@hello-weekend/server build

FROM base AS production
WORKDIR /app
COPY --from=build /app ./
EXPOSE 8080
CMD ["./apps/server/node_modules/.bin/tsx", "apps/server/src/dev.ts"]
