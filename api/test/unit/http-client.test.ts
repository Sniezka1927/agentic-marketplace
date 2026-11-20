import { afterAll, describe, expect, it } from "bun:test";
import { UpstreamError, createHttpClient } from "../../src/x-marketplace";

const requests: { url: URL; authorization: string | null }[] = [];

const server = Bun.serve({
  port: 0,
  fetch(req) {
    const url = new URL(req.url);
    requests.push({ url, authorization: req.headers.get("authorization") });
    if (url.pathname === "/v1/bots") {
      return Response.json({
        bots: [{ id: "x1", name: "X", description: "d", author: "a" }],
        total: 1,
      });
    }
    if (url.pathname === "/v1/bots/x1") {
      return Response.json({ id: "x1", name: "X", description: "d", author: "a" });
    }
    if (url.pathname === "/v1/bots/broken") {
      return new Response("fail", { status: 500 });
    }
    return new Response("not found", { status: 404 });
  },
});

afterAll(() => server.stop(true));

const client = createHttpClient(`http://localhost:${server.port}/v1/`, "jwt-token");

describe("createHttpClient", () => {
  it("lists agents with bearer token and query params", async () => {
    const page = await client.listAgents({ page: 2, limit: 5, q: "x", author: "a" });
    const { url, authorization } = requests[requests.length - 1];

    expect(authorization).toBe("Bearer jwt-token");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "2",
      limit: "5",
      q: "x",
      author: "a",
    });
    expect(page).toEqual({
      items: [
        {
          id: "x1",
          name: "X",
          description: "d",
          author: "a",
          pageUrl: "https://x.ai/bot/x1",
          templateUrl: "grokbot://app/v1/bot-template?id=x1",
        },
      ],
      page: 2,
      limit: 5,
      total: 1,
    });
  });

  it("gets agent by id", async () => {
    expect((await client.getAgent("x1"))?.templateUrl).toBe(
      "grokbot://app/v1/bot-template?id=x1",
    );
  });

  it("returns null on 404", async () => {
    expect(await client.getAgent("missing")).toBeNull();
  });

  it("throws UpstreamError on other errors", async () => {
    await expect(client.getAgent("broken")).rejects.toBeInstanceOf(UpstreamError);
  });
});
