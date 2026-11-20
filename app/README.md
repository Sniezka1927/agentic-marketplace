# app

Next.js frontend for Agentic Marketplace. Talks to the API over REST.

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, default http://localhost:3001
bun install
bun run dev                  # http://localhost:3000
```

The API must be running (see `../api/README.md`).

## Pages

| Route | Access | What it does |
|---|---|---|
| `/templates` | public | catalog: search, category/source filter, sort, pagination (state in URL) |
| `/templates/[id]` | public; drafts for author or admin | details, install/uninstall, reviews; author or admin also edit (version conflict → reload prompt), publish, archive, delete |
| `/installations` | logged in | installed templates |
| `/my/templates` | logged in | own templates in any status |
| `/my/templates/new` | logged in | create a draft |
| `/admin` | admin | categories CRUD, user roles, X marketplace sync and run history |
| `/login`, `/register` | public | auth |

## Structure

```
src/
  app/            routes (App Router)
  components/     providers, auth context, guards, UI kit
  lib/api.ts      fetch wrapper: base URL, bearer token, ApiError from { error: { code, message, details } }
  lib/token-store JWT in localStorage, shared across tabs
  lib/types.ts    API response types
```

- Auth: the token from `/auth/login` or `/auth/register` is kept in `localStorage`; the current user comes from `/auth/me`. A 401 clears the token.
- Data fetching: TanStack Query; API errors are shown inline or as toasts (`sonner`).
- Pages that need a user are wrapped in `RequireAuth` (redirects to `/login?next=...`, checks role).
