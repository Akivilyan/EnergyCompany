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
});
