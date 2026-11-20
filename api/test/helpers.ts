import { sql } from "drizzle-orm";
import { createApp } from "../src/app";
import { createContainer } from "../src/container";
import { db } from "../src/db/client";

export { db };

export const createTestApp = () => createApp(createContainer(db));

export const resetDb = () =>
  db.execute(
    sql`truncate table reviews, installations, templates, sync_runs, categories, users restart identity cascade`,
  );

export const call = (
  app: ReturnType<typeof createTestApp>,
  method: string,
  path: string,
  body?: unknown,
) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
