import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { StubRewardedAdProvider } from "../../src/infra/monetization/rewardedAdProvider.js";
import { RunController } from "../../src/modules/runController.js";
import { createScreenTechTree } from "../../src/modules/screenTechTree.js";


describe("ScreenTechTree", () => {
  it("blocks research entry below level II", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenTechTree(controller);

    const start = screen.startResearch("storage_system_1");
    expect(start.result.ok).toBe(false);
    if (!start.result.ok) {
      expect(start.result.error).toBe("not_unlocked");
    }
    expect(start.uiErrorCode).toBe("tech_locked");
    expect(start.uiCopy).toEqual({
      messageKey: "tech_tree.error.tech_locked",
      actionKey: "tech_tree.action.go_company_upgrade"
    });
    expect(start.before.canOpen).toBe(false);
  });

  it("supports start and cancel research with fund refund", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(controller);
    const start = screen.startResearch("storage_system_1");
    expect(start.result.ok).toBe(true);
    const active = screen.getSnapshot().activeResearch;
    expect(active).not.toBeNull();
    if (!active) return;

    const cancel = screen.cancelResearch(active.researchId);
    expect(cancel.result.ok).toBe(true);
    if (!cancel.result.ok) return;
    expect(cancel.uiErrorCode).toBeNull();
    expect(cancel.uiCopy).toBeNull();
    expect(cancel.after.activeResearch).toBeNull();
    expect(cancel.after.funds).toBe(cancel.before.funds + 60);
  });

  it("research can complete to lit through monthly settle", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(controller);
    const start = screen.startResearch("storage_system_1");
    expect(start.result.ok).toBe(true);

    const advance = controller.advanceMonths(3);
    expect(advance.failed).toBeNull();
    const after = screen.getSnapshot();
    expect(after.activeResearch).toBeNull();
    expect(after.litTechIds).toContain("storage_system_1");
  });

  it("maps speedup ad errors and success for UI", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(controller);

    const noActive = screen.speedupResearchByAd();
    expect(noActive.result.ok).toBe(false);
    expect(noActive.uiErrorCode).toBe("no_active_research");
    expect(noActive.uiCopy).toEqual({
      messageKey: "tech_tree.error.no_active_research",
      actionKey: "tech_tree.action.start_research_first"
    });

    const start = screen.startResearch("storage_system_1");
    expect(start.result.ok).toBe(true);
    const speedup = screen.speedupResearchByAd();
    expect(speedup.result.ok).toBe(true);
    expect(speedup.uiErrorCode).toBeNull();
    expect(speedup.uiCopy).toBeNull();
    expect(speedup.after.activeResearch).toBeNull();
    expect(speedup.after.litTechIds).toContain("storage_system_1");
  });

  it("maps cancelled ad playback without consuming ads or lighting tech", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(
      controller,
      new StubRewardedAdProvider({ kind: "always_cancel" })
    );
    const start = screen.startResearch("storage_system_1");
    expect(start.result.ok).toBe(true);

    const speedup = screen.speedupResearchByAd();
    expect(speedup.result.ok).toBe(false);
    expect(speedup.uiErrorCode).toBe("ad_not_completed");
    expect(speedup.after.activeResearch).not.toBeNull();
    expect(speedup.after.litTechIds).not.toContain("storage_system_1");
    expect(controller.state.adsRemaining).toBe(10);
  });
});
