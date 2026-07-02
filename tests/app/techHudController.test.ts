import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenTechTree } from "../../src/app/screenNavController.js";
import {
  DEFAULT_DEV_TECH_ID,
  formatResearchableTechPressureSummary,
  formatSelectedResearchPressureReason,
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
    expect(formatResearchableTechPressureSummary(boot)).toContain(
      "特大城B（终局都会）·终局负荷->超水电"
    );
    expect(formatSelectedResearchPressureReason(boot)).toBe(
      "压力推荐：特大城B（终局都会） · 终局负荷 -> 超水电"
    );
  });

  it("switches to trunk tech when level V strategic pressure is covered", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("super_hydro");
    clientNavOpenTechTree(boot);

    const selection = getTechHudSelectionSnapshot(boot);

    expect(selection.selectedTechId).toBe("grid_backbone");
    expect(selection.candidates.slice(0, 4).map((candidate) => candidate.techId)).toEqual([
      "grid_backbone",
      "nuclear_1",
      "hydro_2",
      "eng_grid_dispatch"
    ]);
    expect(formatSelectedResearchPressureReason(boot)).toBe(
      "压力推荐：省六（沿海工业走廊） · 主干优先 -> 主干网"
    );

    const cycle = techCycleResearchCandidate(boot);
    expect(cycle.ok).toBe(true);
    expect(getTechHudSelectionSnapshot(boot).selectedTechId).toBe("nuclear_1");
  });

  it("switches to hydro tier tech when trunk and nuclear pressure are covered", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push(
      "super_hydro",
      "grid_regional",
      "grid_backbone",
      "uhv_transmission",
      "nuclear_1",
      "nuclear_2",
      "nuclear_3"
    );
    clientNavOpenTechTree(boot);

    const selection = getTechHudSelectionSnapshot(boot);

    expect(selection.selectedTechId).toBe("hydro_2");
    expect(formatSelectedResearchPressureReason(boot)).toBe(
      "压力推荐：省七（高原水风走廊） · 水点绑定 -> 发电升档"
    );
  });

  it("switches to dispatch tech when mixed late-map pressure is next", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push(
      "super_hydro",
      "grid_regional",
      "grid_backbone",
      "uhv_transmission",
      "nuclear_1",
      "nuclear_2",
      "nuclear_3",
      "hydro_2",
      "hydro_3",
      "hydro_4",
      "hydro_5"
    );
    clientNavOpenTechTree(boot);

    const selection = getTechHudSelectionSnapshot(boot);

    expect(selection.selectedTechId).toBe("eng_grid_dispatch");
    expect(formatResearchableTechPressureSummary(boot)).toContain(
      "省八（边疆综合平衡带）·混合调配->调度"
    );
    expect(formatSelectedResearchPressureReason(boot)).toBe(
      "压力推荐：省八（边疆综合平衡带） · 混合调配 -> 调度"
    );
  });

  it("switches to generation tier tech for terminal slot-density pressure after strategic blockers are covered", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push(
      "super_hydro",
      "grid_regional",
      "grid_backbone",
      "uhv_transmission",
      "nuclear_1",
      "nuclear_2",
      "nuclear_3",
      "hydro_2",
      "hydro_3",
      "hydro_4",
      "hydro_5",
      "eng_grid_dispatch"
    );
    clientNavOpenTechTree(boot);

    const selection = getTechHudSelectionSnapshot(boot);

    expect(selection.selectedTechId).toBe("solar_2");
    expect(formatResearchableTechPressureSummary(boot)).toContain(
      "特大城B（终局都会）·槽位紧->发电升档"
    );
    expect(formatSelectedResearchPressureReason(boot)).toBe(
      "压力推荐：特大城B（终局都会） · 槽位紧 -> 发电升档"
    );
  });

  it("switches to eco tech when fossil-transition pressure is next", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push(
      "super_hydro",
      "grid_regional",
      "grid_backbone",
      "uhv_transmission",
      "nuclear_1",
      "nuclear_2",
      "nuclear_3",
      "hydro_2",
      "hydro_3",
      "hydro_4",
      "hydro_5",
      "eng_grid_dispatch",
      "storage_system_1",
      "storage_system_2",
      "storage_system_3",
      "wind_2",
      "wind_3",
      "wind_4",
      "wind_5",
      "solar_2",
      "solar_3",
      "solar_4",
      "solar_5",
      "thermal_2",
      "thermal_3",
      "thermal_4",
      "thermal_5"
    );
    clientNavOpenTechTree(boot);

    const selection = getTechHudSelectionSnapshot(boot);

    expect(selection.selectedTechId).toBe("eco_thermal");
    expect(formatResearchableTechPressureSummary(boot)).toContain(
      "省六（沿海工业走廊）·化石转型->ECO"
    );
    expect(formatSelectedResearchPressureReason(boot)).toBe(
      "压力推荐：省六（沿海工业走廊） · 化石转型 -> ECO"
    );
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
