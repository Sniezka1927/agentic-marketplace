# api

Bun + ElysiaJS REST API with PostgreSQL. Everything runs in Docker.

```bash
cp .env.example .env   # set passwords
docker compose up --build
```

- API: http://localhost:3001
- API docs (OpenAPI): http://localhost:3001/docs
- Postgres: localhost:5432

On start the API container runs migrations, then the seed (categories + admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`), then the server.

## Database

Drizzle ORM on `Bun.sql`. Schema: `src/db/schema.ts`, migrations: `drizzle/`.

```bash
bun run db:generate   # new migration after schema change
bun run db:migrate
bun run db:seed
```

## Architecture

```
src/
  app.ts            Elysia app: CORS, OpenAPI, error handler, routes
  container.ts      wires repositories -> services
  common/           errors, global error handler, shared schemas
  db/               Drizzle schema, client, migrate, seed
  modules/<name>/
    *.routes.ts     HTTP: params, validation, status codes
    *.dto.ts        request/response schemas + mapping from DB rows
    *.service.ts    business logic, throws AppError
    *.repository.ts data access (Drizzle)
```

Errors are returned as `{ "error": { "code", "message", "details?" } }`: 400 malformed body, 404 not found, 409 conflict, 422 validation / business rule, 500 unexpected.

## Tests

```bash
bun test
```

`test/unit` runs without a database. `test/integration` uses `TEST_DATABASE_URL` only (truncates its tables), never `DATABASE_URL`. The `marketplace_test` database is created on first `docker compose up`; for an existing volume run `docker compose exec db createdb -U marketplace marketplace_test`.

## Auth

- `POST /auth/register` creates a `USER` and returns `{ token, user }`; `POST /auth/login` returns the same.
- Send `Authorization: Bearer <token>`. Tokens are HS256 JWT signed with `JWT_SECRET` (min 32 chars), valid for `JWT_EXPIRES_IN`.
- The user is loaded from the database on every request, so role changes apply immediately.
- Roles: `USER`, `ADMIN`. The first admin comes from the seed (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- Missing/invalid token → 401, wrong role → 403.

## Endpoints

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | public |
| GET | `/auth/me` | logged in |
| GET | `/users?page&limit&q` | ADMIN |
| PATCH | `/users/:id/role` | ADMIN (not own role → 422) |
| GET | `/categories`, `/categories/:id` | public |
| POST, PATCH, DELETE | `/categories`, `/categories/:id` | ADMIN (category with templates cannot be deleted → 409) |
| GET | `/templates?page&limit&q&categoryId&source&sort` | public, only `PUBLISHED` (`sort`: newest, popular, rating, name) |
| GET | `/templates/mine?status&...` | logged in, own templates in any status |
| GET | `/templates/:id` | public for `PUBLISHED`, otherwise author or ADMIN |
| POST | `/templates` | logged in, created as `DRAFT` |
| PATCH | `/templates/:id` | author or ADMIN, body must include current `version` |
| POST | `/templates/:id/publish`, `/templates/:id/archive` | author or ADMIN |
| DELETE | `/templates/:id` | author or ADMIN |
| GET | `/agents`, `/agents/:id` | public (X marketplace PoC) |

## Business rules

- Template `templateUrl` must be a `grokbot://` or `https://` link.
- Publishing needs a description of at least 20 characters; a published template cannot be edited below that.
- Template updates use optimistic locking: `PATCH` with an outdated `version` → 409.
- A template with installations cannot be deleted, only archived (409).
- A category with templates cannot be deleted (409).
- An admin cannot change their own role (422).

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
