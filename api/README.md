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

## Events (async)

`src/events/event-bus.ts` is an in-process event bus. Services publish domain events (`template.installed`, `template.uninstalled`, `review.created`, `review.updated`, `review.deleted`) and return immediately; subscribers run asynchronously after the response (`setImmediate`), each in isolation (a failing handler is logged and does not affect others).

`template-stats.handlers.ts` subscribes to them and recalculates `installsCount`, `ratingAvg` and `ratingCount` from the source tables, so stats stay correct even if events are processed out of order. Stats updates do not change the template `version`.

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
| POST, DELETE | `/templates/:id/install` | logged in |
| GET | `/installations/mine?page&limit` | logged in |
| GET | `/templates/:id/reviews?page&limit` | public |
| POST | `/templates/:id/reviews` | logged in |
| PATCH | `/reviews/:id` | review author |
| DELETE | `/reviews/:id` | review author or ADMIN |
| POST | `/sync/x` | ADMIN, starts import in background → 202 |
| GET | `/sync/runs?page&limit` | ADMIN, import history |

## Business rules

- Template `templateUrl` must be a `grokbot://` or `https://` link.
- Publishing needs a description of at least 20 characters; a published template cannot be edited below that.
- Template updates use optimistic locking: `PATCH` with an outdated `version` → 409.
- A template with installations cannot be deleted, only archived (409).
- A category with templates cannot be deleted (409).
- An admin cannot change their own role (422).
- Only one X marketplace sync can run at a time (409).
- Only `PUBLISHED` templates can be installed (422), and only once per user (409).
- A review needs the template to be installed first (422), cannot be for your own template (422), and is limited to one per user and template (409). Rating is 1–5.

## X marketplace sync

Bots from the X internal marketplace are imported as templates with `source: "X"`, `status: "PUBLISHED"`, `externalAuthor` set and no local author (only admins can edit them). The import:

- runs on startup and then every `X_SYNC_INTERVAL_MINUTES` (0 disables the scheduler), or on demand via `POST /sync/x`;
- pages through `GET {X_MARKETPLACE_URL}/bots` with bearer `X_MARKETPLACE_TOKEN`; without these the API uses a built-in mock client;
- upserts by `(source, externalId)`, puts new templates into the `X_IMPORT_CATEGORY_SLUG` category (default `other`), and bumps `version` only when content actually changed;
- is recorded in `sync_runs` (`RUNNING` → `SUCCESS`/`FAILED` with count or error); a second run while one is in progress → 409.

Local dev without Docker for the API:

```bash
bun install
docker compose up -d db
bun run db:migrate && bun run db:seed
bun run dev
```

`DATABASE_URL` from `.env` points to `localhost`.
