import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { getClientHudCapabilities } from "../../src/app/clientHudCapabilities.js";
import { getCityHudBuildSelectionSnapshot } from "../../src/app/cityHudController.js";
import { companyApplyFirstUnlockedLoan } from "../../src/app/companyHudController.js";
import { clientNavOpenWorldMap } from "../../src/app/screenNavController.js";
import {
  getTechHudSelectionSnapshot,
  techStartDefaultResearch
} from "../../src/app/techHudController.js";
import {
  getWorldHudSelectionSnapshot,
  worldCycleTargetCandidate
} from "../../src/app/worldHudController.js";

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
      canOpenWorldTarget: true,
      canCycleWorldTarget: true,
      canQueueSuperHydro: false,
      canQueueSuperHydroGridLink: false,
      canOperateTech: false,
      canApplyLoan: true,
      canCycleLoanCandidate: true,
      canClaimCashAd: true,
      canSpeedupConstructionByAd: false,
      canStartResearch: false,
      canCancelResearch: false,
      canSpeedupResearchByAd: false,
      canCycleResearchCandidate: false
    });
  });

  it("exposes city build capability only when the selected build is affordable", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    const selected = getCityHudBuildSelectionSnapshot(boot).candidates.find(
      (candidate) => candidate.facilityId === getCityHudBuildSelectionSnapshot(boot).selectedFacilityId
    );
    expect(selected).toBeTruthy();
    const selectedCost = selected?.buildCost ?? 0;
    boot.app.controller.state.funds = selectedCost;

    expect(getClientHudCapabilities(boot).canBuildInCity).toBe(true);
    expect(getClientHudCapabilities(boot).canCycleBuildCandidate).toBe(true);

    boot.app.controller.state.funds = selectedCost - 1;
    expect(getClientHudCapabilities(boot).canBuildInCity).toBe(false);
    expect(getClientHudCapabilities(boot).canCycleBuildCandidate).toBe(true);
  });

  it("hides city build actions when the current city has no build candidates", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    for (const facility of boot.app.controller.config.bundle.facilities) {
      if (facility.facility_id === "nuclear") continue;
      const max = facility.max_per_city ?? 0;
      for (let i = 0; i < max; i += 1) {
        boot.app.controller.state.constructionQueue.push({
          id: `cq-${facility.facility_id}-${i}`,
          cityId: "CITY-START",
          facilityId: facility.facility_id,
          tier: 1,
          monthsRemaining: 1,
          installmentRemaining: 0
        });
      }
    }

    expect(getClientHudCapabilities(boot).canBuildInCity).toBe(false);
    expect(getClientHudCapabilities(boot).canCycleBuildCandidate).toBe(false);
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
      canOpenWorldTarget: true,
      canCycleWorldTarget: true,
      canQueueSuperHydro: false,
      canQueueSuperHydroGridLink: false,
      canOperateTech: true,
      canApplyLoan: true,
      canCycleLoanCandidate: true,
      canClaimCashAd: true,
      canSpeedupConstructionByAd: false,
      canStartResearch: true,
      canCancelResearch: false,
      canSpeedupResearchByAd: false,
      canCycleResearchCandidate: true
    });
  });

  it("hides loan actions while a loan is active", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });

    expect(getClientHudCapabilities(boot).canApplyLoan).toBe(true);
    expect(getClientHudCapabilities(boot).canCycleLoanCandidate).toBe(true);

    const loan = companyApplyFirstUnlockedLoan(boot);
    expect(loan.ok).toBe(true);
    expect(getClientHudCapabilities(boot).canApplyLoan).toBe(false);
    expect(getClientHudCapabilities(boot).canCycleLoanCandidate).toBe(false);
  });

  it("hides ad cash capability when no rewarded ads remain", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });

    expect(getClientHudCapabilities(boot).canClaimCashAd).toBe(true);

    boot.app.controller.state.adsRemaining = 0;
    expect(getClientHudCapabilities(boot).canClaimCashAd).toBe(false);
  });

  it("exposes start research capability only when the selected tech is affordable", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 2;
    const selected = getTechHudSelectionSnapshot(boot).candidates.find(
      (candidate) => candidate.techId === getTechHudSelectionSnapshot(boot).selectedTechId
    );
    expect(selected).toBeTruthy();
    const selectedCost = selected?.researchCost ?? 0;

    boot.app.controller.state.funds = selectedCost;
    expect(getClientHudCapabilities(boot).canStartResearch).toBe(true);
    expect(getClientHudCapabilities(boot).canCycleResearchCandidate).toBe(true);

    boot.app.controller.state.funds = selectedCost - 1;
    expect(getClientHudCapabilities(boot).canStartResearch).toBe(false);
    expect(getClientHudCapabilities(boot).canCycleResearchCandidate).toBe(true);
  });

  it("gates active research actions by active project and remaining ads", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 2;
    boot.app.controller.state.funds = 100;

    const started = techStartDefaultResearch(boot);
    expect(started.ok).toBe(true);
    expect(getClientHudCapabilities(boot).canStartResearch).toBe(false);
    expect(getClientHudCapabilities(boot).canCancelResearch).toBe(true);
    expect(getClientHudCapabilities(boot).canCycleResearchCandidate).toBe(false);
    expect(getClientHudCapabilities(boot).canSpeedupResearchByAd).toBe(true);

    boot.app.controller.state.adsRemaining = 0;
    expect(getClientHudCapabilities(boot).canSpeedupResearchByAd).toBe(false);
  });

  it("exposes region-link queue capability only when the selected link is affordable", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 2;
    boot.app.controller.state.funds = 8;

    expect(getClientHudCapabilities(boot).canQueueRegionLink).toBe(true);

    boot.app.controller.state.funds = 7;
    expect(getClientHudCapabilities(boot).canQueueRegionLink).toBe(false);
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

  it("hides world target open capability when the selected target is locked", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    clientNavOpenWorldMap(boot);

    expect(getClientHudCapabilities(boot).canOpenWorldTarget).toBe(true);

    let guard = 0;
    while (guard < 12) {
      const selection = getWorldHudSelectionSnapshot(boot);
      const selected = selection.candidates.find(
        (candidate) => candidate.candidateId === selection.selectedCandidateId
      );
      if (selected?.unlocked === false) break;
      worldCycleTargetCandidate(boot);
      guard += 1;
    }

    expect(getClientHudCapabilities(boot).canOpenWorldTarget).toBe(false);
    expect(getClientHudCapabilities(boot).canCycleWorldTarget).toBe(true);
  });

  it("exposes super hydro grid link capability for finished isolated output", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.funds = 8;
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

  it("uses discounted trunk cost for super hydro grid link capability", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.funds = 6;
    boot.app.controller.state.litTechIds.push("super_hydro", "grid_backbone");
    boot.app.controller.state.superHydros.super_hydro_1 = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "超级水电一号槽",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 4200
    };

    expect(getClientHudCapabilities(boot).canQueueSuperHydroGridLink).toBe(true);

    boot.app.controller.state.funds = 5;
    expect(getClientHudCapabilities(boot).canQueueSuperHydroGridLink).toBe(false);
  });

  it("uses discounted super hydro build cost for queue capability", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.funds = 147;
    boot.app.controller.state.litTechIds.push("super_hydro", "eng_bulk_procure");

    expect(getClientHudCapabilities(boot).canQueueSuperHydro).toBe(true);

    boot.app.controller.state.funds = 146;
    expect(getClientHudCapabilities(boot).canQueueSuperHydro).toBe(false);
  });
});
