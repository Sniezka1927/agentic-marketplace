import { describe, expect, it } from "bun:test";
import {
  X_BOT_URL_PATTERN,
  grokBotInstallUrl,
  parseXBotUrl,
  xBotPageUrl,
} from "../../src/x/bot-link";

describe("x.ai bot links", () => {
  it("extracts bot id from a valid link", () => {
    expect(parseXBotUrl("https://x.ai/bot/SeMqhg9bPD4Qd_8i7I-vN")).toBe("SeMqhg9bPD4Qd_8i7I-vN");
    expect(parseXBotUrl("  https://www.x.ai/bot/abc-123/  ")).toBe("abc-123");
    expect(parseXBotUrl("https://x.ai/bot/abc?ref=share")).toBe("abc");
  });

  it("rejects other hosts, paths and schemes", () => {
    for (const url of [
      "http://x.ai/bot/abc",
      "https://x.ai/bots/abc",
      "https://x.ai/bot/",
      "https://evil.com/x.ai/bot/abc",
      "https://x.ai.evil.com/bot/abc",
      "https://x.ai/bot/abc/extra",
      "https://x.ai/bot/a b",
      "grokbot://app/v1/bot-template?id=abc",
    ]) {
      expect(parseXBotUrl(url)).toBeNull();
    }
  });

  it("builds page and Grok Bot install links like x.ai does", () => {
    expect(xBotPageUrl("SeMqhg9bPD4Qd_8i7I-vN")).toBe("https://x.ai/bot/SeMqhg9bPD4Qd_8i7I-vN");
    expect(grokBotInstallUrl("SeMqhg9bPD4Qd_8i7I-vN")).toBe(
      "grokbot://app/v1/bot-template?id=SeMqhg9bPD4Qd_8i7I-vN",
    );
  });

  it("keeps the regex used for request validation in sync", () => {
    const pattern = new RegExp(X_BOT_URL_PATTERN);
    expect(pattern.test("https://x.ai/bot/abc")).toBe(true);
    expect(pattern.test("https://x.ai.evil.com/bot/abc")).toBe(false);
  });
});
