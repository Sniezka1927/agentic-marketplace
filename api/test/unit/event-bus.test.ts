import { describe, expect, it } from "bun:test";
import { createEventBus } from "../../src/events/event-bus";

const payload = { templateId: "t1", userId: "u1" };

describe("EventBus", () => {
  it("runs handlers asynchronously after publish returns", async () => {
    const bus = createEventBus();
    const calls: string[] = [];
    bus.subscribe("template.installed", () => {
      calls.push("handler");
    });

    bus.publish("template.installed", payload);
    calls.push("after publish");
    expect(calls).toEqual(["after publish"]);

    await bus.drain();
    expect(calls).toEqual(["after publish", "handler"]);
  });

  it("passes payload to every subscriber of the event only", async () => {
    const bus = createEventBus();
    const received: unknown[] = [];
    bus.subscribe("template.installed", (p) => {
      received.push(["a", p]);
    });
    bus.subscribe("template.installed", (p) => {
      received.push(["b", p]);
    });
    bus.subscribe("template.uninstalled", () => {
      received.push("wrong");
    });

    bus.publish("template.installed", payload);
    await bus.drain();
    expect(received).toEqual([
      ["a", payload],
      ["b", payload],
    ]);
  });

  it("keeps running other handlers when one fails", async () => {
    const errors: unknown[] = [];
    const bus = createEventBus({ error: (...args: unknown[]) => errors.push(args) });
    let ran = false;
    bus.subscribe("template.installed", () => {
      throw new Error("boom");
    });
    bus.subscribe("template.installed", () => {
      ran = true;
    });

    bus.publish("template.installed", payload);
    await bus.drain();
    expect(ran).toBe(true);
    expect(errors).toHaveLength(1);
  });
});
