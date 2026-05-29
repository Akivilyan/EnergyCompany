import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenOnboarding } from "../../src/modules/screenOnboarding.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("ScreenOnboarding", () => {
  it("supports tutorial step advancing until done", () => {
    const controller = RunController.fromRepoRoot(repoRoot, { doctrineId: "tutorial" });
    const screen = createScreenOnboarding(controller);
    expect(screen.getSnapshot().currentStepId).toBe("onb_01_welcome");
    for (let i = 0; i < 7; i += 1) {
      const out = screen.advanceStep();
      expect(out.result.ok).toBe(true);
      expect(out.uiErrorCode).toBeNull();
    }
    const final = screen.getSnapshot();
    expect(final.currentStepId).toBe("onb_done");
    expect(final.cleared).toBe(true);
    expect(final.playableSubPhase).toBe("navigating");
  });

  it("supports skipping tutorial chain", () => {
    const controller = RunController.fromRepoRoot(repoRoot, { doctrineId: "tutorial" });
    const screen = createScreenOnboarding(controller);
    const skip = screen.skipAll();
    expect(skip.result.ok).toBe(true);
    expect(skip.after.skipped).toBe(true);
    expect(skip.after.cleared).toBe(false);
    expect(skip.after.currentStepId).toBe("onb_done");
  });

  it("maps not_tutorial_run error for normal runs", () => {
    const controller = RunController.fromRepoRoot(repoRoot, { doctrineId: "tech" });
    const screen = createScreenOnboarding(controller);
    const advance = screen.advanceStep();
    expect(advance.result.ok).toBe(false);
    expect(advance.uiErrorCode).toBe("not_tutorial_run");
    expect(advance.uiCopy).toEqual({
      messageKey: "onboarding.error.not_tutorial_run",
      actionKey: "onboarding.action.start_tutorial_run"
    });
  });
});
