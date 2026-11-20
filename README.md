# Agentic Marketplace

A marketplace of agent templates for Grok Bot. Users publish their own agent templates, browse and search the catalog, install templates with one click (`grokbot://` link) and review the ones they use. Bots from the X internal marketplace are imported into the catalog automatically. Admins manage categories, user roles and the import.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | [Bun](https://bun.sh) 1.4, [ElysiaJS](https://elysiajs.com) (REST API), TypeBox validation |
| Database | PostgreSQL 17, [Drizzle ORM](https://orm.drizzle.team) on `Bun.sql`, drizzle-kit migrations |
| Auth | JWT (HS256, `jose`), passwords hashed with `Bun.password` (argon2id) |
| API docs | OpenAPI 3.1 via `@elysiajs/openapi` (Scalar UI at `/docs`) |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, TanStack Query, sonner |
| Infrastructure | Docker Compose (`db` + `api`), GitHub Actions CI |
| Tests | `bun test`: unit tests (services with fake repositories) and integration tests (HTTP → DB) |

## Repository layout

```
api/   REST API, database schema and migrations, tests, Dockerfile, docker-compose.yml
app/   Next.js frontend
.github/workflows/ci.yml   lint, build, migrations and tests for api; lint and build for app
```

## Running the project

Requirements: Docker with Docker Compose, Bun 1.4+.

### 1. API and database (Docker)

```bash
cd api
cp .env.example .env        # change passwords and JWT_SECRET before real use
docker compose up --build
```

- API: http://localhost:3001
- API docs (OpenAPI): http://localhost:3001/docs
- PostgreSQL: localhost:5432

On start the API container applies migrations, seeds categories and the admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`), starts the server and runs the first import from the X marketplace (mock data unless `X_MARKETPLACE_URL` and `X_MARKETPLACE_TOKEN` are set).

### 2. Frontend

```bash
cd app
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:3001
bun install
bun run dev
```

Open http://localhost:3000. Log in as the seeded admin, or create a regular account with "Sign up".

### Tests

```bash
cd api
docker compose up -d db     # creates marketplace_test on first start
bun install
bun test
```

Integration tests use only `TEST_DATABASE_URL`. For a database volume created before the test database existed, run `docker compose exec db createdb -U marketplace marketplace_test` once.

### Configuration

All configuration comes from environment variables (`api/.env`, `app/.env.local`); no secrets are stored in the repository. See `api/.env.example`:

| Variable | Purpose |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | database credentials (compose refuses to start without them) |
| `DATABASE_URL`, `TEST_DATABASE_URL` | connection strings for local dev and tests |
| `JWT_SECRET` (≥ 32 chars), `JWT_EXPIRES_IN` | token signing and lifetime; the API refuses to start without a secret |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | initial admin created by the seed |
| `CORS_ORIGIN` | frontend origin allowed by CORS |
| `X_MARKETPLACE_URL`, `X_MARKETPLACE_TOKEN` | X marketplace API and bearer JWT (mock client when empty) |
| `X_SYNC_INTERVAL_MINUTES`, `X_IMPORT_CATEGORY_SLUG` | import schedule (0 disables) and category for imported bots |

## Features

- **Accounts and roles:** registration, login, JWT bearer auth. `USER` and `ADMIN` roles; admins can promote or demote other users.
- **Templates:** create as draft, edit, publish, archive and delete. The catalog has search, category and source filters, sorting (newest, most installed, top rated, name) and pagination. Drafts are visible only to the author and admins.
- **Installations:** install and uninstall published templates; "Installed" page; the install link opens the template in Grok Bot.
- **Reviews:** 1–5 star rating with a comment. Authors can edit their own reviews; authors and admins can delete them.
- **Statistics:** install count and average rating are recalculated asynchronously by event handlers.
- **X marketplace integration:** a scheduled and on-demand import of bots from the external X marketplace API, with run history.
- **Admin panel:** categories CRUD, users and roles, X sync with history.

### Business rules

1. Only `PUBLISHED` templates can be installed, and each user can install a template only once.
2. A review requires the template to be installed, cannot be written for your own template, and is limited to one per user and template.
3. Publishing requires a description of at least 20 characters.
4. Template edits use optimistic locking: saving with an outdated `version` returns 409.
5. A template with installations cannot be deleted, only archived. A category with templates cannot be deleted.
6. Only the author or an admin can modify a template; an admin cannot change their own role.
7. Only one X marketplace import can run at a time.

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI[Next.js app<br/>TanStack Query]
  end
  subgraph API[Elysia API]
    R[routes + DTO<br/>validation, status codes] --> S[services<br/>business rules]
    S --> Rep[repositories<br/>Drizzle]
    S -- publish --> E((event bus))
    E -- async --> H[stats handlers]
    H --> Rep
    Sch[scheduler] --> Sync[sync service]
    Sync --> X[X marketplace client]
    Sync --> Rep
  end
  UI -- REST + Bearer JWT --> R
  Rep --> DB[(PostgreSQL)]
  X -- HTTPS + Bearer JWT --> XM[X marketplace API]
```

How a request flows, e.g. `POST /templates/:id/install`:

1. **Route** (`installation.routes.ts`): the `auth` guard reads the bearer token, verifies the JWT and loads the user (401 / 403); `params` are validated (`uuid`, otherwise 422).
2. **Service** (`installation.service.ts`): checks the business rules (template exists and is `PUBLISHED`, not installed yet) and throws `BusinessRuleError` (422) or `ConflictError` (409).
3. **Repository** (`installation.repository.ts`): inserts the row with Drizzle; unique constraints back up the rules at database level.
4. The service publishes `template.installed`; the response (DTO, 201) is sent immediately and the stats handler then updates `installs_count` asynchronously.
5. Any error is turned into `{ "error": { "code", "message", "details?" } }` with the right status by the global error handler.

Details: [`api/README.md`](api/README.md) (layers, events, auth, endpoints) and [`app/README.md`](app/README.md) (pages, client architecture).

## Data model

```mermaid
erDiagram
  USERS ||--o{ TEMPLATES : authors
  CATEGORIES ||--o{ TEMPLATES : groups
  USERS ||--o{ INSTALLATIONS : installs
  TEMPLATES ||--o{ INSTALLATIONS : "installed as"
  USERS ||--o{ REVIEWS : writes
  TEMPLATES ||--o{ REVIEWS : receives
  USERS |o--o{ SYNC_RUNS : triggers

  USERS {
    uuid id PK
    varchar email UK
    text password_hash
    varchar display_name
    enum role "USER | ADMIN"
    timestamptz created_at
    timestamptz updated_at
  }
  CATEGORIES {
    uuid id PK
    varchar name UK
    varchar slug UK
    text description
    timestamptz created_at
    timestamptz updated_at
  }
  TEMPLATES {
    uuid id PK
    varchar name
    text description
    text template_url
    enum status "DRAFT | PUBLISHED | ARCHIVED"
    enum source "LOCAL | X"
    varchar external_id "unique with source"
    varchar external_author
    uuid author_id FK "nullable"
    uuid category_id FK
    int version "optimistic locking"
    int installs_count
    float rating_avg
    int rating_count
    timestamptz published_at
    timestamptz created_at
    timestamptz updated_at
  }
  INSTALLATIONS {
    uuid id PK
    uuid user_id FK
    uuid template_id FK
    timestamptz installed_at
  }
  REVIEWS {
    uuid id PK
    uuid user_id FK
    uuid template_id FK
    smallint rating "1-5"
    text comment
    timestamptz created_at
    timestamptz updated_at
  }
  SYNC_RUNS {
    uuid id PK
    enum status "RUNNING | SUCCESS | FAILED"
    int imported
    text error
    uuid triggered_by_id FK "nullable"
    timestamptz started_at
    timestamptz finished_at
  }
```

`installations` and `reviews` are unique per `(user_id, template_id)`.

## REST API

Interactive documentation with request/response schemas: **http://localhost:3001/docs** (OpenAPI JSON at `/docs/json`).

| Method | Path | Access | Success |
|---|---|---|---|
| POST | `/auth/register` | public | 201 `{ token, user }` |
| POST | `/auth/login` | public | 200 `{ token, user }` |
| GET | `/auth/me` | logged in | 200 user |
| GET | `/users?page&limit&q` | ADMIN | 200 page of users |
| PATCH | `/users/:id/role` | ADMIN | 200 user |
| GET | `/categories` · `/categories/:id` | public | 200 |
| POST | `/categories` | ADMIN | 201 |
| PATCH · DELETE | `/categories/:id` | ADMIN | 200 · 204 |
| GET | `/templates?page&limit&q&categoryId&source&sort` | public (published only) | 200 page |
| GET | `/templates/mine?status&…` | logged in | 200 page |
| GET | `/templates/:id` | public / author / ADMIN | 200 |
| POST | `/templates` | logged in | 201 draft |
| PATCH | `/templates/:id` (body includes `version`) | author / ADMIN | 200 |
| POST | `/templates/:id/publish` · `/archive` | author / ADMIN | 200 |
| DELETE | `/templates/:id` | author / ADMIN | 204 |
| GET · POST · DELETE | `/templates/:id/install` | logged in | 200 · 201 · 204 |
| GET | `/installations/mine?page&limit` | logged in | 200 page |
| GET | `/templates/:id/reviews?page&limit` | public | 200 page |
| POST | `/templates/:id/reviews` | logged in | 201 |
| PATCH · DELETE | `/reviews/:id` | review author (DELETE also ADMIN) | 200 · 204 |
| POST | `/sync/x` | ADMIN | 202 run started |
| GET | `/sync/runs?page&limit` | ADMIN | 200 page |

Error responses: 400 malformed body, 401 missing or invalid token, 403 role or ownership, 404 not found, 409 conflict (duplicate, outdated version, in use), 422 validation or business rule, 500 unexpected. Body: `{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [{ "path": "/rating", "message": "…" }] } }`.

## Demo

Demo video: _link to be added_.
