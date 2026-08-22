FROM node:22-alpine AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=processcanvas-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --fetch-retries 5 --fetch-timeout 120000

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
ARG GO_API_URL=http://backend:8080
ENV GO_API_URL=$GO_API_URL
ENV NEXT_STANDALONE=true
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
