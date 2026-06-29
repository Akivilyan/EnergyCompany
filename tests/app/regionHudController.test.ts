import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenRegion, clientNavOpenRegionById } from "../../src/app/screenNavController.js";
import {
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

    const out = regionQueueDefaultLink(boot);
    expect(out.ok).toBe(true);
    expect(out.messageKey).toBe("region.success.trunk_queued");
  });
});
