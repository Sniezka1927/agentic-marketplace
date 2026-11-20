import { describe, expect, it } from "bun:test";
import { startScheduler } from "../../src/scheduler/scheduler";

const silent = { info: () => {}, error: () => {} };

describe("startScheduler", () => {
  it("runs job immediately and then on interval until stopped", async () => {
    let runs = 0;
    const stop = startScheduler(
      [{ name: "job", intervalMs: 20, run: async () => void runs++ }],
      silent,
    );
    await Bun.sleep(70);
    stop();
    const afterStop = runs;
    expect(afterStop).toBeGreaterThanOrEqual(3);
    await Bun.sleep(50);
    expect(runs).toBe(afterStop);
  });

  it("skips disabled jobs and survives failing jobs", async () => {
    let disabled = 0;
    const errors: unknown[] = [];
    const stop = startScheduler(
      [
        { name: "off", intervalMs: 0, run: async () => void disabled++ },
        {
          name: "failing",
          intervalMs: 10,
          run: async () => {
            throw new Error("boom");
          },
        },
      ],
      { info: () => {}, error: (...args: unknown[]) => errors.push(args) },
    );
    await Bun.sleep(35);
    stop();
    expect(disabled).toBe(0);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
