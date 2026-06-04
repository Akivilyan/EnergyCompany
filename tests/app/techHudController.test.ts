import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenTechTree } from "../../src/app/screenNavController.js";
import {
  DEFAULT_DEV_TECH_ID,
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
