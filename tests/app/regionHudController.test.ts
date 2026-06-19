import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenRegion } from "../../src/app/screenNavController.js";
import {
  getRegionHudSelectionSnapshot,
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
    const links = boot.app.screens.region.getSnapshot().gridLinks;
    expect(links.some((l) => l.fromCityId === "CITY-START" && l.toCityId === "CITY-MAP01-02")).toBe(
      true
    );
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
});
