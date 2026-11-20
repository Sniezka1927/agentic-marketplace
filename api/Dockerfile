FROM oven/bun:1.4.2-alpine
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY drizzle ./drizzle

ENV PORT=3001
EXPOSE 3001
CMD ["sh", "-c", "bun run src/db/migrate.ts && bun run src/db/seed.ts && bun run src/index.ts"]
