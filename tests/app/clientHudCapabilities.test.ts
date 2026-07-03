import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { getClientHudCapabilities } from "../../src/app/clientHudCapabilities.js";
import { clientNavOpenWorldMap } from "../../src/app/screenNavController.js";
import { worldCycleTargetCandidate } from "../../src/app/worldHudController.js";

describe("getClientHudCapabilities", () => {
  it("hides locked region-link and tech actions at level 1", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });

    expect(boot.app.controller.state.companyLevel).toBe(1);
    expect(getClientHudCapabilities(boot)).toEqual({
      canBuildInCity: true,
      canCycleBuildCandidate: true,
      canQueueRegionLink: false,
      canCycleRegionLink: false,
      canCancelRegionLink: false,
      canQueueWorldTrunk: false,
      canQueueSuperHydro: false,
      canQueueSuperHydroGridLink: false,
      canOperateTech: false
    });
  });

  it("unlocks region-link and tech actions after company level 2", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });

    boot.play.buildInCurrentCity("wind", 1);
    boot.play.buildInCurrentCity("wind", 1);
    for (let i = 0; i < 2; i += 1) {
      boot.play.advanceMonthInCurrentCity();
    }

    expect(boot.app.controller.state.companyLevel).toBeGreaterThanOrEqual(2);
    expect(getClientHudCapabilities(boot)).toEqual({
      canBuildInCity: true,
      canCycleBuildCandidate: true,
      canQueueRegionLink: true,
      canCycleRegionLink: true,
      canCancelRegionLink: false,
      canQueueWorldTrunk: false,
      canQueueSuperHydro: false,
      canQueueSuperHydroGridLink: false,
      canOperateTech: true
    });
  });

  it("exposes selected world trunk queue capability only for an affordable map target", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenWorldMap(boot);
    worldCycleTargetCandidate(boot);

    expect(getClientHudCapabilities(boot).canQueueWorldTrunk).toBe(true);

    boot.app.controller.state.funds = 7;
    expect(getClientHudCapabilities(boot).canQueueWorldTrunk).toBe(false);
  });

  it("exposes super hydro grid link capability for finished isolated output", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.funds = 200;
    boot.app.controller.state.litTechIds.push("super_hydro");
    boot.app.controller.state.superHydros.super_hydro_1 = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "超级水电一号槽",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 4200
    };

    expect(getClientHudCapabilities(boot).canQueueSuperHydroGridLink).toBe(true);

    boot.app.controller.state.funds = 7;
    expect(getClientHudCapabilities(boot).canQueueSuperHydroGridLink).toBe(false);
  });
});
