# api

Bun + ElysiaJS REST API with PostgreSQL. Everything runs in Docker.

```bash
cp .env.example .env   # set passwords
docker compose up --build
```

- API: http://localhost:3001
- Postgres: localhost:5432

On start the API container runs migrations, then the seed (categories + admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`), then the server.

## Database

Drizzle ORM on `Bun.sql`. Schema: `src/db/schema.ts`, migrations: `drizzle/`.

```bash
bun run db:generate   # new migration after schema change
bun run db:migrate
bun run db:seed
```

## Endpoints

- `GET /agents?page=1&limit=20&q=&author=` → `{ items, page, limit, total }` (`limit` max 100)
- `GET /agents/:id` → `Agent` or 404

`Agent`: `id`, `name`, `description`, `author`, `pageUrl`, `templateUrl` (`grokbot://app/v1/bot-template?id=<id>`).

## X marketplace

Set `X_MARKETPLACE_URL` and `X_MARKETPLACE_TOKEN` (bearer JWT) to use the real X marketplace (`GET {url}/bots`, `GET {url}/bots/:id`). Without them the API serves mock data. Upstream errors return 502.

Local dev without Docker for the API:

```bash
bun install
docker compose up -d db
bun run db:migrate && bun run db:seed
bun run dev
```

`DATABASE_URL` from `.env` points to `localhost`.
