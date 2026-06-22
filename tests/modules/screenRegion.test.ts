import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenRegion, createScreenRegionForRegion } from "../../src/modules/screenRegion.js";


describe("ScreenRegion", () => {
  it("shows city unlock status by company level", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenRegion(controller);

    const before = screen.getSnapshot();
    const cityLv2 = before.cities.find((city) => city.cityId === "CITY-MAP01-02");
    expect(cityLv2?.unlocked).toBe(false);

    controller.state.companyLevel = 2;
    const after = screen.getSnapshot();
    const cityLv2After = after.cities.find((city) => city.cityId === "CITY-MAP01-02");
    expect(cityLv2After?.unlocked).toBe(true);
  });

  it("blocks grid link into locked city at level I", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenRegion(controller);

    const action = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(action.result.ok).toBe(false);
    if (!action.result.ok) {
      expect(action.result.error).toBe("not_unlocked");
    }
  });

  it("allows grid link into level II city when unlocked", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenRegion(controller);

    const action = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(action.result.ok).toBe(true);
    const linkId = "CITY-MAP01-02::CITY-START";
    expect(action.after.gridLinks.some((link) => link.linkId === linkId)).toBe(true);
  });

  it("shows grid_regional-adjusted link cost in snapshot", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 3;
    const screen = createScreenRegion(controller);
    expect(screen.getSnapshot().gridLinkCost).toBe(8);

    controller.state.litTechIds.push("grid_regional");
    expect(screen.getSnapshot().gridLinkCost).toBe(6);
  });

  it("advances month and finishes queued region link", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenRegion(controller);

    const queue = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(queue.result.ok).toBe(true);

    const advance = screen.advanceMonths(1);
    expect(advance.failed).toBeNull();
    expect(advance.reports).toHaveLength(1);
    const linkId = "CITY-MAP01-02::CITY-START";
    const link = advance.reports[0].after.gridLinks.find((item) => item.linkId === linkId);
    expect(link?.status).toBe("finished");
    expect(link?.monthsRemaining).toBe(0);
  });

  it("exposes trunk first and region links after second-batch region is connected", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 3;
    const screen = createScreenRegionForRegion(controller, "MAP-02");

    const snapshot = screen.getSnapshot();
    expect(
      snapshot.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP02-01" &&
          candidate.toCityId === "CITY-MAP02-02" &&
          candidate.linkType === "region"
      )
    ).toBe(false);
    expect(
      snapshot.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP02-01" &&
          candidate.toCityId === "CITY-START" &&
          candidate.linkType === "trunk"
      )
    ).toBe(true);

    const queue = screen.queueGridLink("CITY-MAP02-01", "CITY-START", "trunk");
    expect(queue.result.ok).toBe(true);
    const advance = screen.advanceMonths(1);
    expect(advance.failed).toBeNull();

    const connected = screen.getSnapshot();
    expect(
      connected.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP02-01" &&
          candidate.toCityId === "CITY-MAP02-02" &&
          candidate.linkType === "region"
      )
    ).toBe(true);
  });

  it("opens level-IV province as trunk-first region before local links unlock", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 4;
    const screen = createScreenRegionForRegion(controller, "MAP-03");

    const snapshot = screen.getSnapshot();
    expect(snapshot.cities).toHaveLength(3);
    expect(
      snapshot.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP03-01" &&
          candidate.toCityId === "CITY-START" &&
          candidate.linkType === "trunk"
      )
    ).toBe(true);
    expect(
      snapshot.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP03-01" &&
          candidate.toCityId === "CITY-MAP03-02" &&
          candidate.linkType === "region"
      )
    ).toBe(false);

    const queue = screen.queueGridLink("CITY-MAP03-01", "CITY-START", "trunk");
    expect(queue.result.ok).toBe(true);
    const advance = screen.advanceMonths(1);
    expect(advance.failed).toBeNull();

    const connected = screen.getSnapshot();
    expect(
      connected.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP03-01" &&
          candidate.toCityId === "CITY-MAP03-02" &&
          candidate.linkType === "region"
      )
    ).toBe(true);
  });

  it("opens level-V province as trunk-first region before local links unlock", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 5;
    const screen = createScreenRegionForRegion(controller, "MAP-06");

    const snapshot = screen.getSnapshot();
    expect(snapshot.cities).toHaveLength(3);
    expect(
      snapshot.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP06-01" &&
          candidate.toCityId === "CITY-START" &&
          candidate.linkType === "trunk"
      )
    ).toBe(true);
    expect(
      snapshot.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP06-01" &&
          candidate.toCityId === "CITY-MAP06-02" &&
          candidate.linkType === "region"
      )
    ).toBe(false);

    const queue = screen.queueGridLink("CITY-MAP06-01", "CITY-START", "trunk");
    expect(queue.result.ok).toBe(true);
    const advance = screen.advanceMonths(1);
    expect(advance.failed).toBeNull();

    const connected = screen.getSnapshot();
    expect(
      connected.linkCandidates.some(
        (candidate) =>
          candidate.fromCityId === "CITY-MAP06-01" &&
          candidate.toCityId === "CITY-MAP06-02" &&
          candidate.linkType === "region"
      )
    ).toBe(true);
  });
});
