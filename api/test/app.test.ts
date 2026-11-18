import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("GET /", () => {
  it("responds with 200", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    expect(res.status).toBe(200);
  });
});
