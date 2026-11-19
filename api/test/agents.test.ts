import { describe, expect, it } from "bun:test";
import { createApp } from "../src/app";
import {
  UpstreamError,
  createMockClient,
  type MarketplaceClient,
  type XBot,
} from "../src/x-marketplace";

const bots: XBot[] = [
  { id: "a1", name: "Alpha", description: "Files helper", author: "Ala" },
  { id: "b2", name: "Beta", description: "Spreadsheet helper", author: "Bob" },
  { id: "c3", name: "Gamma", description: "Drafts writer", author: "Ala" },
];

const app = createApp(createMockClient(bots));
const get = (path: string) => app.handle(new Request(`http://localhost${path}`));

describe("GET /agents", () => {
  it("returns first page with defaults", async () => {
    const res = await get("/agents");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(body.total).toBe(3);
    expect(body.items.map((a: { id: string }) => a.id)).toEqual(["a1", "b2", "c3"]);
  });

  it("paginates", async () => {
    const body = await (await get("/agents?page=2&limit=2")).json();
    expect(body.total).toBe(3);
    expect(body.items.map((a: { id: string }) => a.id)).toEqual(["c3"]);
  });

  it("filters by q in name and description", async () => {
    const body = await (await get("/agents?q=helper")).json();
    expect(body.items.map((a: { id: string }) => a.id)).toEqual(["a1", "b2"]);
  });

  it("filters by author", async () => {
    const body = await (await get("/agents?author=ala")).json();
    expect(body.items.map((a: { id: string }) => a.id)).toEqual(["a1", "c3"]);
  });

  it("rejects invalid pagination", async () => {
    expect((await get("/agents?limit=0")).status).toBe(422);
    expect((await get("/agents?limit=101")).status).toBe(422);
    expect((await get("/agents?page=abc")).status).toBe(422);
  });
});

describe("GET /agents/:id", () => {
  it("returns agent with template url", async () => {
    const res = await get("/agents/a1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "a1",
      name: "Alpha",
      description: "Files helper",
      author: "Ala",
      pageUrl: "https://x.ai/bot/a1",
      templateUrl: "grokbot://app/v1/bot-template?id=a1",
    });
  });

  it("returns 404 for unknown agent", async () => {
    expect((await get("/agents/missing")).status).toBe(404);
  });
});

describe("upstream failure", () => {
  const failing: MarketplaceClient = {
    listAgents: async () => {
      throw new UpstreamError(500);
    },
    getAgent: async () => {
      throw new UpstreamError(503);
    },
  };
  const failingApp = createApp(failing);

  it("returns 502", async () => {
    const list = await failingApp.handle(new Request("http://localhost/agents"));
    const one = await failingApp.handle(new Request("http://localhost/agents/a1"));
    expect(list.status).toBe(502);
    expect(one.status).toBe(502);
  });
});
