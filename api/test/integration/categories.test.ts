import { beforeEach, describe, expect, it } from "bun:test";
import { categories, templates } from "../../src/db/schema";
import { call, createTestApp, db, resetDb } from "../helpers";

const app = createTestApp();

beforeEach(async () => {
  await resetDb();
});

const createCategory = async (body: Record<string, unknown>) =>
  call(app, "POST", "/categories", body);

describe("/categories", () => {
  it("creates and lists categories", async () => {
    const res = await createCategory({ name: "Productivity", description: "Get things done" });
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created).toMatchObject({ name: "Productivity", slug: "productivity" });

    const list = await (await call(app, "GET", "/categories")).json();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);
  });

  it("returns 422 with details for invalid body", async () => {
    const res = await createCategory({ name: "x" });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.length).toBeGreaterThan(0);
  });

  it("returns 409 for duplicate slug", async () => {
    await createCategory({ name: "Writing" });
    const res = await createCategory({ name: "writing" });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });

  it("returns 404 for unknown id and 422 for malformed id", async () => {
    expect((await call(app, "GET", `/categories/${crypto.randomUUID()}`)).status).toBe(404);
    expect((await call(app, "GET", "/categories/not-a-uuid")).status).toBe(422);
  });

  it("updates category", async () => {
    const { id } = await (await createCategory({ name: "Research" })).json();
    const res = await call(app, "PATCH", `/categories/${id}`, { description: "Deep dives" });
    expect(res.status).toBe(200);
    expect((await res.json()).description).toBe("Deep dives");
  });

  it("deletes empty category with 204", async () => {
    const { id } = await (await createCategory({ name: "Research" })).json();
    expect((await call(app, "DELETE", `/categories/${id}`)).status).toBe(204);
    expect((await call(app, "GET", `/categories/${id}`)).status).toBe(404);
  });

  it("refuses to delete category with templates", async () => {
    const [category] = await db
      .insert(categories)
      .values({ name: "Automation", slug: "automation" })
      .returning();
    await db.insert(templates).values({
      name: "Bot",
      templateUrl: "grokbot://app/v1/bot-template?id=1",
      categoryId: category!.id,
    });
    const res = await call(app, "DELETE", `/categories/${category!.id}`);
    expect(res.status).toBe(409);
  });

  it("returns 404 json for unknown route", async () => {
    const res = await call(app, "GET", "/nope");
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
});
