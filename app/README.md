# app

Next.js frontend for Agentic Marketplace. Talks to the API over REST.

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, default http://localhost:3001
bun install
bun run dev                  # http://localhost:3000
```

The API must be running (see `../api/README.md`).

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
