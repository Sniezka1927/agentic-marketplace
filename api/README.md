# api

Bun + ElysiaJS REST API with PostgreSQL. Everything runs in Docker.

```bash
cp .env.example .env   # optional, defaults match
docker compose up --build
```

- API: http://localhost:3001
- Postgres: localhost:5432 (`DATABASE_URL` is passed to the API container)

## Endpoints

- `GET /agents?page=1&limit=20&q=&author=` → `{ items, page, limit, total }` (`limit` max 100)
- `GET /agents/:id` → `Agent` or 404

`Agent`: `id`, `name`, `description`, `author`, `pageUrl`, `templateUrl` (`grokbot://app/v1/bot-template?id=<id>`).

## X marketplace

Set `X_MARKETPLACE_URL` and `X_MARKETPLACE_TOKEN` (bearer JWT) to use the real X marketplace (`GET {url}/bots`, `GET {url}/bots/:id`). Without them the API serves mock data. Upstream errors return 502.

Local dev without Docker for the API:

```bash
bun install
docker compose up db
DATABASE_URL=postgres://marketplace:marketplace@localhost:5432/marketplace bun run dev
```
