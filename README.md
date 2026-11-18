# agentic-marketplace

Marketplace of agent templates: anyone can publish a template and install it.

## Structure

- `app/` – Next.js UI (Bun), talks to the API over REST
- `api/` – Bun + ElysiaJS REST API with PostgreSQL (Docker)

## App

```bash
cd app
bun install
bun run dev
```
