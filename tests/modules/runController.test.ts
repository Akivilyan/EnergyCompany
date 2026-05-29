import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("RunController trace", () => {
  it("records command success and failure traces", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.adsRemaining = 1;

    const ok = controller.runCommand({ type: "claim_ad_reward", adType: "cash" });
    expect(ok.ok).toBe(true);

    const fail = controller.runCommand({ type: "claim_ad_reward", adType: "cash" });
    expect(fail.ok).toBe(false);

    const trace = controller.getTrace();
    expect(trace).toHaveLength(2);
    expect(trace[0].kind).toBe("command");
    expect(trace[0].ok).toBe(true);
    expect(trace[1].kind).toBe("command");
    expect(trace[1].ok).toBe(false);
  });

  it("records settle traces and supports clearTrace", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const month = controller.runNextMonth();
    expect(month.ok).toBe(true);

    const trace = controller.getTrace();
    expect(trace).toHaveLength(1);
    expect(trace[0].kind).toBe("settle");
    expect(trace[0].ok).toBe(true);

    controller.clearTrace();
    expect(controller.getTrace()).toHaveLength(0);
  });

  it("returns city snapshot for UI wiring", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const snapshot = controller.getCitySnapshot("CITY-START");
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;
    expect(snapshot.cityId).toBe("CITY-START");
    expect(snapshot.month).toBe(1);
    expect(snapshot.facilityCountInCity).toBe(0);
  });

  it("supports build-and-advance helper for city loop", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const step = controller.buildAndAdvance("CITY-START", "wind", 1, true);
    expect(step.buildResult.ok).toBe(true);
    expect(step.settleResult?.ok).toBe(true);
    expect(step.before?.month).toBe(1);
    expect(step.afterSettle?.month).toBe(2);
    expect(controller.getTrace()).toHaveLength(2);
  });

  it("supports multi-month advance helper", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const out = controller.advanceMonths(3);
    expect(out.failed).toBeNull();
    expect(out.reports).toHaveLength(3);
    expect(controller.state.currentMonth).toBe(4);
    const settleTraceCount = controller.getTrace().filter((t) => t.kind === "settle").length;
    expect(settleTraceCount).toBe(3);
  });
});
