import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenTechTree } from "../../src/app/screenNavController.js";
import {
  DEFAULT_DEV_TECH_ID,
  getTechHudSelectionSnapshot,
  techCycleResearchCandidate,
  techCancelActiveResearch,
  techEnsureLevelIIForDev,
  techSpeedupResearchByAd,
  techStartDefaultResearch
} from "../../src/app/techHudController.js";

describe("techHudController", () => {
  it("starts default research at level II", () => {
    const boot = createGameBootstrapFromRepo();
    const ready = techEnsureLevelIIForDev(boot);
    expect(ready.ok).toBe(true);
    clientNavOpenTechTree(boot);
    const out = techStartDefaultResearch(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.screens.tech.getSnapshot().activeResearch?.techId).toBe(DEFAULT_DEV_TECH_ID);
  });

  it("cycles selected research candidate before starting", () => {
    const boot = createGameBootstrapFromRepo();
    techEnsureLevelIIForDev(boot);
    clientNavOpenTechTree(boot);

    const before = getTechHudSelectionSnapshot(boot);
    expect(before.selectedTechId).toBe(DEFAULT_DEV_TECH_ID);

    const cycle = techCycleResearchCandidate(boot);
    expect(cycle.ok).toBe(true);
    expect(cycle.messageKey).toBe("tech_tree.action.selected_next_candidate");

    const after = getTechHudSelectionSnapshot(boot);
    expect(after.selectedTechId).not.toBe(before.selectedTechId);

    const start = techStartDefaultResearch(boot);
    expect(start.ok).toBe(true);
    expect(boot.app.screens.tech.getSnapshot().activeResearch?.techId).toBe(after.selectedTechId);
  });

  it("defaults to strategic branch research at level V", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    clientNavOpenTechTree(boot);

    const selection = getTechHudSelectionSnapshot(boot);

    expect(selection.selectedTechId).toBe("super_hydro");
  });

  it("switches to trunk tech when level V strategic pressure is covered", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("super_hydro");
    clientNavOpenTechTree(boot);

    const selection = getTechHudSelectionSnapshot(boot);

    expect(selection.selectedTechId).toBe("grid_backbone");
  });

  it("cancels active research with refund", () => {
    const boot = createGameBootstrapFromRepo();
    techEnsureLevelIIForDev(boot);
    clientNavOpenTechTree(boot);
    techStartDefaultResearch(boot);
    const before = boot.app.controller.state.funds;
    const out = techCancelActiveResearch(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.screens.tech.getSnapshot().activeResearch).toBeNull();
    expect(boot.app.controller.state.funds).toBeGreaterThan(before);
  });

  it("speeds up active research via ad stub", () => {
    const boot = createGameBootstrapFromRepo();
    techEnsureLevelIIForDev(boot);
    clientNavOpenTechTree(boot);
    techStartDefaultResearch(boot);
    const out = techSpeedupResearchByAd(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.screens.tech.getSnapshot().litTechIds).toContain(DEFAULT_DEV_TECH_ID);
  });
});
