import { beforeEach, describe, expect, it } from "bun:test";
import { categories } from "../../src/db/schema";
import { call, createTestApp, createUser, db, resetDb } from "../helpers";

const app = createTestApp();

let author: Awaited<ReturnType<typeof createUser>>;
let user: Awaited<ReturnType<typeof createUser>>;
let templateId: string;

const createTemplate = async (publish: boolean) => {
  const [category] = await db
    .insert(categories)
    .values({ name: `Cat ${crypto.randomUUID()}`, slug: crypto.randomUUID() })
    .returning();
  const res = await call(app, "POST", "/templates", {
    token: author.token,
    body: {
      name: "Inbox Helper",
      description: "Sorts your inbox and drafts replies for you.",
      templateUrl: "grokbot://app/v1/bot-template?id=inbox",
      categoryId: category!.id,
    },
  });
  const { id } = await res.json();
  if (publish) await call(app, "POST", `/templates/${id}/publish`, { token: author.token });
  return id as string;
};

beforeEach(async () => {
  await resetDb();
  author = await createUser(app, "USER");
  user = await createUser(app, "USER");
  templateId = await createTemplate(true);
});

const install = (id: string, token = user.token) =>
  call(app, "POST", `/templates/${id}/install`, { token });

const review = (body: Record<string, unknown>, token = user.token, id = templateId) =>
  call(app, "POST", `/templates/${id}/reviews`, { token, body });

describe("installations", () => {
  it("installs, lists and uninstalls a template", async () => {
    const res = await install(templateId);
    expect(res.status).toBe(201);
    expect((await res.json()).templateId).toBe(templateId);

    const mine = await (
      await call(app, "GET", "/installations/mine", { token: user.token })
    ).json();
    expect(mine.total).toBe(1);
    expect(mine.items[0].template.id).toBe(templateId);

    expect(
      (await call(app, "DELETE", `/templates/${templateId}/install`, { token: user.token }))
        .status,
    ).toBe(204);
    expect(
      (await call(app, "DELETE", `/templates/${templateId}/install`, { token: user.token }))
        .status,
    ).toBe(404);
  });

  it("rejects second install with 409", async () => {
    await install(templateId);
    expect((await install(templateId)).status).toBe(409);
  });

  it("rejects installing a draft with 422", async () => {
    const draftId = await createTemplate(false);
    const res = await install(draftId);
    expect(res.status).toBe(422);
  });

  it("requires login", async () => {
    expect((await call(app, "POST", `/templates/${templateId}/install`)).status).toBe(401);
  });
});

describe("reviews", () => {
  it("creates review after installing and lists it publicly", async () => {
    await install(templateId);
    const res = await review({ rating: 5, comment: "Saves me an hour a day" });
    expect(res.status).toBe(201);

    const list = await (await call(app, "GET", `/templates/${templateId}/reviews`)).json();
    expect(list.total).toBe(1);
    expect(list.items[0]).toMatchObject({ rating: 5, user: { id: user.user.id } });
  });

  it("rejects review without installation", async () => {
    const res = await review({ rating: 4 });
    expect(res.status).toBe(422);
    expect((await res.json()).error.message).toContain("Install");
  });

  it("rejects review of own template", async () => {
    await install(templateId, author.token);
    expect((await review({ rating: 5 }, author.token)).status).toBe(422);
  });

  it("rejects second review and invalid rating", async () => {
    await install(templateId);
    await review({ rating: 3 });
    expect((await review({ rating: 4 })).status).toBe(409);
    expect((await review({ rating: 6 })).status).toBe(422);
  });

  it("lets owner edit, others not; admin can delete", async () => {
    await install(templateId);
    const { id } = await (await review({ rating: 2 })).json();

    const edited = await call(app, "PATCH", `/reviews/${id}`, {
      token: user.token,
      body: { rating: 4 },
    });
    expect((await edited.json()).rating).toBe(4);

    const foreign = await call(app, "PATCH", `/reviews/${id}`, {
      token: author.token,
      body: { rating: 1 },
    });
    expect(foreign.status).toBe(403);

    const admin = await createUser(app, "ADMIN");
    expect((await call(app, "DELETE", `/reviews/${id}`, { token: admin.token })).status).toBe(
      204,
    );
  });

  it("blocks deleting a template that has installations", async () => {
    await install(templateId);
    const res = await call(app, "DELETE", `/templates/${templateId}`, { token: author.token });
    expect(res.status).toBe(409);
  });
});
