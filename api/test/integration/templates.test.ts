import { beforeEach, describe, expect, it } from "bun:test";
import { categories, installations } from "../../src/db/schema";
import { call, createTestApp, createUser, db, resetDb } from "../helpers";

const app = createTestApp();

let categoryId: string;
let otherCategoryId: string;
let author: Awaited<ReturnType<typeof createUser>>;

beforeEach(async () => {
  await resetDb();
  const rows = await db
    .insert(categories)
    .values([
      { name: "Productivity", slug: "productivity" },
      { name: "Writing", slug: "writing" },
    ])
    .returning();
  categoryId = rows[0]!.id;
  otherCategoryId = rows[1]!.id;
  author = await createUser(app, "USER");
});

const description = "Organizes files and drafts weekly status reports.";

const createTemplate = async (
  overrides: Record<string, unknown> = {},
  token = author.token,
) => {
  const res = await call(app, "POST", "/templates", {
    token,
    body: {
      name: "File Sorter",
      description,
      templateUrl: "grokbot://app/v1/bot-template?id=abc",
      categoryId,
      ...overrides,
    },
  });
  return { res, body: await res.json() };
};

const publish = (id: string, token = author.token) =>
  call(app, "POST", `/templates/${id}/publish`, { token });

describe("/templates", () => {
  it("creates a draft and requires auth", async () => {
    const { res, body } = await createTemplate();
    expect(res.status).toBe(201);
    expect(body).toMatchObject({
      status: "DRAFT",
      version: 1,
      author: { id: author.user.id },
      category: { id: categoryId, slug: "productivity" },
    });

    const anonymous = await call(app, "POST", "/templates", { body: { name: "x" } });
    expect(anonymous.status).toBe(401);
  });

  it("validates template url and category", async () => {
    expect((await createTemplate({ templateUrl: "ftp://nope" })).res.status).toBe(422);
    expect((await createTemplate({ categoryId: crypto.randomUUID() })).res.status).toBe(422);
  });

  it("lists only published templates publicly, with pagination", async () => {
    const a = (await createTemplate({ name: "Alpha" })).body;
    const b = (await createTemplate({ name: "Beta" })).body;
    await createTemplate({ name: "Gamma draft" });
    await publish(a.id);
    await publish(b.id);

    const res = await call(app, "GET", "/templates?limit=1&sort=name");
    const page = await res.json();
    expect(res.status).toBe(200);
    expect(page.total).toBe(2);
    expect(page.items.map((t: { name: string }) => t.name)).toEqual(["Alpha"]);

    const second = await (await call(app, "GET", "/templates?limit=1&page=2&sort=name")).json();
    expect(second.items.map((t: { name: string }) => t.name)).toEqual(["Beta"]);
  });

  it("filters by search text and category", async () => {
    const a = (await createTemplate({ name: "Report Writer" })).body;
    const b = (await createTemplate({ name: "Inbox Zero", categoryId: otherCategoryId })).body;
    await publish(a.id);
    await publish(b.id);

    const byText = await (await call(app, "GET", "/templates?q=writer")).json();
    expect(byText.items.map((t: { id: string }) => t.id)).toEqual([a.id]);

    const byCategory = await (
      await call(app, "GET", `/templates?categoryId=${otherCategoryId}`)
    ).json();
    expect(byCategory.items.map((t: { id: string }) => t.id)).toEqual([b.id]);
  });

  it("lists own templates in any status", async () => {
    await createTemplate({ name: "Mine" });
    const other = await createUser(app, "USER");
    await createTemplate({ name: "Theirs" }, other.token);

    const res = await call(app, "GET", "/templates/mine?status=DRAFT", { token: author.token });
    const page = await res.json();
    expect(page.total).toBe(1);
    expect(page.items[0].name).toBe("Mine");
  });

  it("hides drafts from others", async () => {
    const { body } = await createTemplate();
    const other = await createUser(app, "USER");
    expect((await call(app, "GET", `/templates/${body.id}`)).status).toBe(404);
    expect(
      (await call(app, "GET", `/templates/${body.id}`, { token: other.token })).status,
    ).toBe(404);
    expect(
      (await call(app, "GET", `/templates/${body.id}`, { token: author.token })).status,
    ).toBe(200);
  });

  it("uses optimistic locking on update", async () => {
    const { body } = await createTemplate();
    const first = await call(app, "PATCH", `/templates/${body.id}`, {
      token: author.token,
      body: { name: "Renamed", version: 1 },
    });
    expect(first.status).toBe(200);
    expect((await first.json()).version).toBe(2);

    const stale = await call(app, "PATCH", `/templates/${body.id}`, {
      token: author.token,
      body: { name: "Stale", version: 1 },
    });
    expect(stale.status).toBe(409);
  });

  it("forbids editing someone else's template, allows admin", async () => {
    const { body } = await createTemplate();
    await publish(body.id);
    const other = await createUser(app, "USER");
    const admin = await createUser(app, "ADMIN");

    const forbidden = await call(app, "PATCH", `/templates/${body.id}`, {
      token: other.token,
      body: { name: "Mine now", version: 2 },
    });
    expect(forbidden.status).toBe(403);

    const asAdmin = await call(app, "PATCH", `/templates/${body.id}`, {
      token: admin.token,
      body: { name: "Moderated", version: 2 },
    });
    expect(asAdmin.status).toBe(200);
  });

  it("requires description to publish", async () => {
    const { body } = await createTemplate({ description: "short" });
    const res = await publish(body.id);
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("BUSINESS_RULE_VIOLATION");
  });

  it("archives a template and removes it from public list", async () => {
    const { body } = await createTemplate();
    await publish(body.id);
    const archived = await call(app, "POST", `/templates/${body.id}/archive`, {
      token: author.token,
    });
    expect((await archived.json()).status).toBe("ARCHIVED");
    expect((await (await call(app, "GET", "/templates")).json()).total).toBe(0);
  });

  it("deletes template without installations but not with", async () => {
    const free = (await createTemplate()).body;
    expect(
      (await call(app, "DELETE", `/templates/${free.id}`, { token: author.token })).status,
    ).toBe(204);

    const used = (await createTemplate()).body;
    await publish(used.id);
    await db.insert(installations).values({ userId: author.user.id, templateId: used.id });
    const res = await call(app, "DELETE", `/templates/${used.id}`, { token: author.token });
    expect(res.status).toBe(409);
  });
});
