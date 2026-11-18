# api

Bun + ElysiaJS REST API with PostgreSQL. Everything runs in Docker.

```bash
cp .env.example .env   # optional, defaults match
docker compose up --build
```

- API: http://localhost:3001
- Postgres: localhost:5432 (`DATABASE_URL` is passed to the API container)

Local dev without Docker for the API:

```bash
bun install
docker compose up db
DATABASE_URL=postgres://marketplace:marketplace@localhost:5432/marketplace bun run dev
```
