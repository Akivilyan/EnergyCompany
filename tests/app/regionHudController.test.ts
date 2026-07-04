import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenRegion, clientNavOpenRegionById } from "../../src/app/screenNavController.js";
import {
  formatSelectedRegionLinkAction,
  getRegionHudSelectionSnapshot,
  regionCancelSelectedLink,
  regionCycleLinkCandidate,
  regionQueueDefaultLink
} from "../../src/app/regionHudController.js";
import { techEnsureLevelIIForDev } from "../../src/app/techHudController.js";

describe("regionHudController", () => {
  it("blocks default link at company level I", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenRegion(boot);
    const out = regionQueueDefaultLink(boot);
    expect(out.ok).toBe(false);
    expect(out.errorCode).toBe("not_unlocked");
    expect(out.messageKey).toBe("region.error.not_unlocked");
  });

  it("queues default region link at company level II", () => {
    const boot = createGameBootstrapFromRepo();
    const level = techEnsureLevelIIForDev(boot);
    expect(level.ok).toBe(true);
    clientNavOpenRegion(boot);
    const out = regionQueueDefaultLink(boot);
    expect(out.ok).toBe(true);
    const links = boot.app.screens.region(boot.play.getNavigation().regionId ?? "MAP-01").getSnapshot().gridLinks;
    expect(links.some((l) => l.fromCityId === "CITY-START" && l.toCityId === "CITY-MAP01-02")).toBe(
      true
    );
  });

  it("cancels selected building region link from hud", () => {
    const boot = createGameBootstrapFromRepo();
    const level = techEnsureLevelIIForDev(boot);
    expect(level.ok).toBe(true);
    clientNavOpenRegion(boot);
    const queued = regionQueueDefaultLink(boot);
    expect(queued.ok).toBe(true);

    const selection = getRegionHudSelectionSnapshot(boot);
    expect(selection.cancelableLinks).toHaveLength(1);

    const cancelled = regionCancelSelectedLink(boot);
    expect(cancelled.ok).toBe(true);
    expect(cancelled.messageKey).toBe("region.success.link_cancelled");
    expect(getRegionHudSelectionSnapshot(boot).cancelableLinks).toHaveLength(0);
  });

  it("cycles to second-batch map candidate and queues trunk at company level III", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenRegion(boot);

    const initial = getRegionHudSelectionSnapshot(boot);
    expect(initial.candidates.length).toBeGreaterThan(2);

    let guard = 0;
    while (
      getRegionHudSelectionSnapshot(boot).candidates.find(
        (candidate) =>
          candidate.candidateId === getRegionHudSelectionSnapshot(boot).selectedCandidateId
      )?.linkType !== "trunk" &&
      guard < 8
    ) {
      const cycle = regionCycleLinkCandidate(boot);
      expect(cycle.ok).toBe(true);
      guard += 1;
    }

    const selected = getRegionHudSelectionSnapshot(boot);
    const active = selected.candidates.find(
      (candidate) => candidate.candidateId === selected.selectedCandidateId
    );
    expect(active?.fromCityId).toBe("CITY-START");
    expect(active?.toCityId).toBe("CITY-MAP02-01");
    expect(active?.linkType).toBe("trunk");

    const out = regionQueueDefaultLink(boot);
    expect(out.ok).toBe(true);
    expect(out.messageKey).toBe("region.success.trunk_queued");
  });

  it("formats level-V trunk action priority for late-map regions", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    clientNavOpenRegionById(boot, "MAP-06");

    const selection = getRegionHudSelectionSnapshot(boot);
    const active = selection.candidates.find(
      (candidate) => candidate.candidateId === selection.selectedCandidateId
    );
    expect(active?.fromCityId).toBe("CITY-MAP06-01");
    expect(active?.toCityId).toBe("CITY-START");
    expect(active?.linkType).toBe("trunk");
    expect(formatSelectedRegionLinkAction(boot)).toBe("行动建议：先建主干，打开区域内铺线");
  });

  it("moves from finished late-map trunk to the first available in-region link", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    clientNavOpenRegionById(boot, "MAP-06");

    const queued = regionQueueDefaultLink(boot);
    expect(queued.ok).toBe(true);
    expect(formatSelectedRegionLinkAction(boot)).toBe("行动建议：等待当前线路完工");

    boot.play.advanceMonthInCurrentCity();

    const selection = getRegionHudSelectionSnapshot(boot);
    const active = selection.candidates.find(
      (candidate) => candidate.candidateId === selection.selectedCandidateId
    );
    expect(active?.fromCityId).toBe("CITY-MAP06-01");
    expect(active?.toCityId).toBe("CITY-MAP06-02");
    expect(active?.linkType).toBe("region");
    expect(formatSelectedRegionLinkAction(boot)).toBe("行动建议：补区域线，消化本地缺口");
  });

  it("moves from finished default MAP-01 link to the next available local link", () => {
    const boot = createGameBootstrapFromRepo();
    const level = techEnsureLevelIIForDev(boot);
    expect(level.ok).toBe(true);
    clientNavOpenRegion(boot);

    const queued = regionQueueDefaultLink(boot);
    expect(queued.ok).toBe(true);
    expect(formatSelectedRegionLinkAction(boot)).toBe("行动建议：等待当前线路完工");

    boot.play.advanceMonthInCurrentCity();

    const selection = getRegionHudSelectionSnapshot(boot);
    const active = selection.candidates.find(
      (candidate) => candidate.candidateId === selection.selectedCandidateId
    );
    expect(active?.fromCityId).toBe("CITY-START");
    expect(active?.toCityId).toBe("CITY-MAP01-03");
    expect(active?.linkType).toBe("region");
    expect(formatSelectedRegionLinkAction(boot)).toBe("行动建议：补区域线，消化本地缺口");
  });

  it("defaults to super hydro trunk after the capital trunk already exists", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("super_hydro");
    boot.app.controller.state.gridLinks["CITY-MAP06-01::CITY-START"] = {
      linkId: "CITY-MAP06-01::CITY-START",
      fromCityId: "CITY-MAP06-01",
      toCityId: "CITY-START",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 500
    };
    boot.app.controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "Jinsha River UHV Hydro Base",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 1800
    };
    clientNavOpenRegionById(boot, "MAP-06");

    const selection = getRegionHudSelectionSnapshot(boot);
    const active = selection.candidates.find(
      (candidate) => candidate.candidateId === selection.selectedCandidateId
    );
    expect(active?.fromCityId).toBe("CITY-MAP06-01");
    expect(active?.toCityId).toBe("SUPER-HYDRO-1");
    expect(active?.linkType).toBe("trunk");
    expect(formatSelectedRegionLinkAction(boot)).toBe("行动建议：接入超级水电，释放外部出力");
  });

  it("cycles to finished super hydro trunk candidate and queues it", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("super_hydro");
    boot.app.controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "Jinsha River UHV Hydro Base",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 1800
    };
    clientNavOpenRegionById(boot, "MAP-06");

    let guard = 0;
    while (
      getRegionHudSelectionSnapshot(boot).candidates.find(
        (candidate) =>
          candidate.candidateId === getRegionHudSelectionSnapshot(boot).selectedCandidateId
      )?.toCityId !== "SUPER-HYDRO-1" &&
      guard < 16
    ) {
      const cycle = regionCycleLinkCandidate(boot);
      expect(cycle.ok).toBe(true);
      guard += 1;
    }

    const selected = getRegionHudSelectionSnapshot(boot);
    const active = selected.candidates.find(
      (candidate) => candidate.candidateId === selected.selectedCandidateId
    );
    expect(active?.fromCityId).toBe("CITY-MAP06-01");
    expect(active?.toCityId).toBe("SUPER-HYDRO-1");
    expect(active?.linkType).toBe("trunk");
    expect(formatSelectedRegionLinkAction(boot)).toBe("行动建议：接入超级水电，释放外部出力");

    const out = regionQueueDefaultLink(boot);
    expect(out.ok).toBe(true);
    expect(out.messageKey).toBe("region.success.trunk_queued");
  });
});
