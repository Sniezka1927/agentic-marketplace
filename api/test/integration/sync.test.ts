import { beforeEach, describe, expect, it } from "bun:test";
import { categories } from "../../src/db/schema";
import { createMockClient, type XBot } from "../../src/x-marketplace";
import { call, createTestApp, createUser, db, resetDb } from "../helpers";

const bots: XBot[] = [
  {
    id: "SeMqhg9bPD4Qd_8i7I-vN",
    name: "New Bot",
    description: "A warm, concise desktop assistant for files and drafts.",
    author: "Aleksander",
  },
  { id: "x-2", name: "Research Buddy", description: "Finds sources fast.", author: "Ola" },
];

const app = createTestApp(createMockClient(bots));
let admin: Awaited<ReturnType<typeof createUser>>;

beforeEach(async () => {
  await resetDb();
  await db.insert(categories).values({ name: "Other", slug: "other" });
  admin = await createUser(app, "ADMIN");
});

const syncAndWait = async () => {
  const res = await call(app, "POST", "/sync/x", { token: admin.token });
  expect(res.status).toBe(202);
  const { id } = await res.json();
  for (let i = 0; i < 50; i++) {
    const runs = await (await call(app, "GET", "/sync/runs", { token: admin.token })).json();
    const run = runs.items.find((r: { id: string }) => r.id === id);
    if (run.status !== "RUNNING") return run;
    await Bun.sleep(20);
  }
  throw new Error("sync did not finish");
};

describe("/sync/x", () => {
  it("imports X bots as published templates", async () => {
    const run = await syncAndWait();
    expect(run).toMatchObject({ status: "SUCCESS", imported: 2, triggeredById: admin.user.id });

    const list = await (await call(app, "GET", "/templates?source=X&sort=name")).json();
    expect(list.total).toBe(2);
    expect(list.items[0]).toMatchObject({
      name: "New Bot",
      source: "X",
      status: "PUBLISHED",
      author: null,
      externalAuthor: "Aleksander",
      templateUrl: "grokbot://app/v1/bot-template?id=SeMqhg9bPD4Qd_8i7I-vN",
      category: { slug: "other" },
    });
  });

  it("is idempotent and does not bump version when nothing changed", async () => {
    await syncAndWait();
    await syncAndWait();
    const list = await (await call(app, "GET", "/templates?source=X")).json();
    expect(list.total).toBe(2);
    expect(list.items.every((t: { version: number }) => t.version === 1)).toBe(true);
  });

  it("is admin only", async () => {
    const { token } = await createUser(app, "USER");
    expect((await call(app, "POST", "/sync/x", { token })).status).toBe(403);
    expect((await call(app, "GET", "/sync/runs", { token })).status).toBe(403);
  });

  it("lets users install imported templates", async () => {
    await syncAndWait();
    const { token } = await createUser(app, "USER");
    const { items } = await (await call(app, "GET", "/templates?source=X")).json();
    const res = await call(app, "POST", `/templates/${items[0].id}/install`, { token });
    expect(res.status).toBe(201);
  });
});
