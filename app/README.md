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
| `/` | public | redirects to `/templates` |
| `/templates` | public | catalog: search, category filter, sort, pagination (state in URL) |
| `/templates/[id]` | public; drafts for author or admin | details, install (records the install and opens the `grokbot://` deeplink, same as "Add to Grok Bot" on x.ai), link to the x.ai page, reviews; author or admin also edit (version conflict → reload prompt), publish, archive, delete |
| `/my/templates` | logged in | own templates in any status |
| `/my/templates/new` | logged in | create a draft from an x.ai bot link (`https://x.ai/bot/<id>`) |
| `/admin` | admin | categories CRUD, user roles |
| `/login`, `/register` | public | auth |

## Structure

```
src/
  app/            routes (App Router)
  components/     providers, auth context, guards, UI kit
  lib/api.ts      fetch wrapper: base URL, bearer token, ApiError from { error: { code, message, details } }
  lib/token-store JWT in localStorage, shared across tabs
  lib/types.ts    API response types
  vendor/bloub/   avatar engine from jeremy-prt/bloub (MIT), see its README
```

- Auth: the token from `/auth/login` or `/auth/register` is kept in `localStorage`; the current user comes from `/auth/me`. A 401 clears the token.
- Data fetching: TanStack Query; API errors are shown inline, next to the form or button that triggered them.
- Bot avatars: `components/bot-avatar.tsx` renders the vendored bloub engine (x.ai-style bot avatar); shape, colour and expression are derived from the bot id, the template page shows it animated.
- Pages that need a user are wrapped in `RequireAuth` (redirects to `/login?next=...`, checks role).
