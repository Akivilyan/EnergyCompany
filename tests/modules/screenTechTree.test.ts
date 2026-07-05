import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  StubRewardedAdProvider,
  type RewardedAdOutcome,
  type RewardedAdProvider,
  type RewardedAdRequest
} from "../../src/infra/monetization/rewardedAdProvider.js";
import { RunController } from "../../src/modules/runController.js";
import { createScreenTechTree } from "../../src/modules/screenTechTree.js";

class AsyncOnlyRewardedAdProvider implements RewardedAdProvider {
  showRewardedAd(_request: RewardedAdRequest): RewardedAdOutcome {
    return {
      status: "failed",
      provider: "stub",
      providerCode: "sync_not_supported",
      message: "sync path should not be used"
    };
  }

  showRewardedAdAsync(_request: RewardedAdRequest): Promise<RewardedAdOutcome> {
    return Promise.resolve({ status: "completed", provider: "stub", providerCode: "async_only" });
  }
}

describe("ScreenTechTree", () => {
  it("blocks research entry below level II", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenTechTree(controller);

    const start = screen.startResearch("wind_2");
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
    const start = screen.startResearch("wind_2");
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
    expect(cancel.after.funds).toBe(cancel.before.funds + 32);
  });

  it("research can complete to lit through monthly settle", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(controller);
    const start = screen.startResearch("wind_2");
    expect(start.result.ok).toBe(true);

    const advance = controller.advanceMonths(3);
    expect(advance.failed).toBeNull();
    const after = screen.getSnapshot();
    expect(after.activeResearch).toBeNull();
    expect(after.litTechIds).toContain("wind_2");
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

    const start = screen.startResearch("wind_2");
    expect(start.result.ok).toBe(true);
    const speedup = screen.speedupResearchByAd();
    expect(speedup.result.ok).toBe(true);
    expect(speedup.uiErrorCode).toBeNull();
    expect(speedup.uiCopy).toBeNull();
    expect(speedup.after.activeResearch).toBeNull();
    expect(speedup.after.litTechIds).toContain("wind_2");
  });

  it("maps cancelled ad playback without consuming ads or lighting tech", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(
      controller,
      new StubRewardedAdProvider({ kind: "always_cancel" })
    );
    const start = screen.startResearch("wind_2");
    expect(start.result.ok).toBe(true);

    const speedup = screen.speedupResearchByAd();
    expect(speedup.result.ok).toBe(false);
    expect(speedup.uiErrorCode).toBe("ad_not_completed");
    expect(speedup.after.activeResearch).not.toBeNull();
    expect(speedup.after.litTechIds).not.toContain("wind_2");
    expect(controller.state.adsRemaining).toBe(10);
  });

  it("speeds up active research through async ad provider", async () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(controller, new AsyncOnlyRewardedAdProvider());
    const start = screen.startResearch("wind_2");
    expect(start.result.ok).toBe(true);

    const speedup = await screen.speedupResearchByAdAsync();
    expect(speedup.result.ok).toBe(true);
    expect(speedup.uiErrorCode).toBeNull();
    expect(speedup.after.activeResearch).toBeNull();
    expect(speedup.after.litTechIds).toContain("wind_2");
    expect(controller.state.adsRemaining).toBe(9);
  });

  it("exposes technology list snapshot with current unlock states", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenTechTree(controller);

    const snapshot = screen.getSnapshot();
    const wind2 = snapshot.technologies.find((item) => item.techId === "wind_2");
    const storage1 = snapshot.technologies.find((item) => item.techId === "storage_system_1");

    expect(wind2?.status).toBe("unlocked");
    expect(wind2?.displayName).toBe("风电·II");
    expect(storage1?.status).toBe("locked");
    expect(wind2?.effectSummary).toBe("wind tier <= 2");
    expect(wind2?.researchCost).toBe(32);
    expect(wind2?.researchMonths).toBe(1);
    expect(snapshot.researchableTechIds).toEqual([
      "eng_bulk_procure",
      "hydro_2",
      "solar_2",
      "thermal_2",
      "wind_2"
    ]);
  });

  it("unlocks level-IV grid and eco technologies as research candidates", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 4;
    const screen = createScreenTechTree(controller);

    const snapshot = screen.getSnapshot();
    const backbone = snapshot.technologies.find((item) => item.techId === "grid_backbone");
    const ecoThermal = snapshot.technologies.find((item) => item.techId === "eco_thermal");
    const ecoNuclear = snapshot.technologies.find((item) => item.techId === "eco_nuclear");

    expect(backbone?.status).toBe("unlocked");
    expect(ecoThermal?.status).toBe("unlocked");
    expect(ecoNuclear?.status).toBe("unlocked");
    expect(snapshot.researchableTechIds).toContain("grid_backbone");
    expect(snapshot.researchableTechIds).toContain("eco_thermal");
    expect(snapshot.researchableTechIds).toContain("eco_nuclear");
    expect(ecoThermal?.effectSummary).toBe("thermal facilities become eco");
    expect(ecoNuclear?.effectSummary).toBe("nuclear facilities become eco");
  });

  it("unlocks super hydro as a level-V hydro candidate", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 5;
    const screen = createScreenTechTree(controller);

    const snapshot = screen.getSnapshot();
    const superHydro = snapshot.technologies.find((item) => item.techId === "super_hydro");

    expect(superHydro?.status).toBe("unlocked");
    expect(snapshot.researchableTechIds).toContain("super_hydro");
    expect(superHydro?.effectSummary).toBe("super hydro slots +2");
  });

  it("exposes engineering tech effect summaries for demo branch pressure", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 5;
    const screen = createScreenTechTree(controller);

    const snapshot = screen.getSnapshot();
    const cashflow = snapshot.technologies.find((item) => item.techId === "eng_cashflow");
    const greenPr = snapshot.technologies.find((item) => item.techId === "eng_green_pr");
    const riskReserve = snapshot.technologies.find((item) => item.techId === "eng_risk_reserve");

    expect(cashflow?.effectSummary).toBe("loan tier +1");
    expect(greenPr?.effectSummary).toBe("eco city SV +5%");
    expect(riskReserve?.effectSummary).toBe("disaster cash -15%");
  });

  it("keeps wind_3 locked until storage_system_1 and wind_2 are both lit", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 3;
    const screen = createScreenTechTree(controller);

    let snapshot = screen.getSnapshot();
    expect(snapshot.technologies.find((item) => item.techId === "wind_3")?.status).toBe("locked");

    controller.state.litTechIds.push("storage_system_1");
    snapshot = screen.getSnapshot();
    expect(snapshot.technologies.find((item) => item.techId === "wind_3")?.status).toBe("locked");

    controller.state.litTechIds.push("wind_2");
    snapshot = screen.getSnapshot();
    expect(snapshot.technologies.find((item) => item.techId === "wind_3")?.status).toBe("unlocked");
  });
});
