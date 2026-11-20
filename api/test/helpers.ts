import { sql } from "drizzle-orm";
import { createApp } from "../src/app";
import { createContainer } from "../src/container";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";

export { db };

export type TestApp = ReturnType<typeof createTestApp>;

export const createTestApp = () => createApp(createContainer(db));

export const resetDb = () =>
  db.execute(
    sql`truncate table reviews, installations, templates, sync_runs, categories, users restart identity cascade`,
  );

export const call = (
  app: TestApp,
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {},
) => {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
  );
};

export const TEST_PASSWORD = "password123";

export const createUser = async (
  app: TestApp,
  role: "USER" | "ADMIN" = "USER",
) => {
  const email = `${role.toLowerCase()}-${crypto.randomUUID()}@test.dev`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      displayName: role,
      role,
      passwordHash: await Bun.password.hash(TEST_PASSWORD, {
        algorithm: "bcrypt",
        cost: 4,
      }),
    })
    .returning();
  const res = await call(app, "POST", "/auth/login", {
    body: { email, password: TEST_PASSWORD },
  });
  const { token } = await res.json();
  return { user: user!, token: token as string };
};
