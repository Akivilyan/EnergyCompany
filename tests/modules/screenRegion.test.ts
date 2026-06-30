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

  it("cancels building grid link and restores funds in region screen", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenRegion(controller);
    const initialFunds = controller.state.funds;

    const queued = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(queued.result.ok).toBe(true);
    const linkId = "CITY-MAP01-02::CITY-START";
    expect(queued.after.gridLinks.find((link) => link.linkId === linkId)?.buildCost).toBe(8);

    const cancelled = screen.cancelGridLink(linkId);
    expect(cancelled.result.ok).toBe(true);
    expect(cancelled.after.funds).toBe(initialFunds);
    expect(cancelled.after.gridLinks.some((link) => link.linkId === linkId)).toBe(false);
  });

  it("shows grid_regional-adjusted link cost in snapshot", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 3;
    const screen = createScreenRegion(controller);
    expect(screen.getSnapshot().gridLinkCost).toBe(8);

    controller.state.litTechIds.push("grid_regional");
    expect(screen.getSnapshot().gridLinkCost).toBe(6);
  });

  it("shows eng_grid_dispatch-adjusted regional loss in link candidates", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 3;
    const screen = createScreenRegion(controller);

    const before = screen
      .getSnapshot()
      .linkCandidates.find((candidate) => candidate.linkType === "region");
    expect(before?.lossMw).toBe(125);

    controller.state.litTechIds.push("eng_grid_dispatch");
    const after = screen
      .getSnapshot()
      .linkCandidates.find((candidate) => candidate.linkType === "region");
    expect(after?.lossMw).toBe(112);
  });

  it("shows grid_backbone-adjusted trunk candidate cost in snapshot", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 4;
    const screen = createScreenRegionForRegion(controller, "MAP-03");

    const before = screen
      .getSnapshot()
      .linkCandidates.find((candidate) => candidate.linkType === "trunk");
    expect(before?.cost).toBe(8);

    controller.state.litTechIds.push("grid_backbone");
    const after = screen
      .getSnapshot()
      .linkCandidates.find((candidate) => candidate.linkType === "trunk");
    expect(after?.cost).toBe(6);
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
    expect(snapshot.totalDemandMw).toBe(1920);
    expect(snapshot.designRole).toBe("coastal_industrial_export_province");
    expect(snapshot.totalLocalSupplyMw).toBe(0);
    expect(snapshot.totalNetImportMw).toBe(0);
    expect(snapshot.totalEffectiveSupplyMw).toBe(0);
    expect(snapshot.supplyGapMw).toBe(1920);
    expect(snapshot.totalBuildSlots).toBe(13);
    expect(snapshot.riverCityCount).toBe(0);
    expect(snapshot.nuclearEligibleCityCount).toBe(1);
    expect(snapshot.totalBaseSocialValue).toBe(38);
    expect(snapshot.richResources).toEqual(["wind", "solar", "fossil"]);
    expect(snapshot.recommendedBuilds).toEqual(["wind", "solar", "thermal", "nuclear"]);
    expect(snapshot.operatingPressureTags).toEqual([
      "high_demand",
      "supply_gap",
      "trunk_first",
      "no_hydro",
      "fossil_transition",
      "nuclear_siting"
    ]);
    expect(snapshot.operatingPlanHints).toEqual([
      "secure_trunk",
      "close_supply_gap",
      "local_renewables",
      "thermal_bridge",
      "nuclear_anchor"
    ]);
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

  it("summarizes regional local supply, net import, and gap from runtime cities", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 5;
    controller.state.cities["CITY-MAP06-01"] = {
      cityId: "CITY-MAP06-01",
      demandMw: 1280,
      localSupplyMw: 300,
      effectiveSupplyMw: 900,
      netImportMw: 600,
      supplyRatio: 0.7,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: 18
    };
    const screen = createScreenRegionForRegion(controller, "MAP-06");

    const snapshot = screen.getSnapshot();

    expect(snapshot.totalDemandMw).toBe(1920);
    expect(snapshot.totalLocalSupplyMw).toBe(300);
    expect(snapshot.totalNetImportMw).toBe(600);
    expect(snapshot.totalEffectiveSupplyMw).toBe(900);
    expect(snapshot.supplyGapMw).toBe(1020);
  });

  it("exposes finished super hydro as trunk candidate from a level-V region", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 5;
    controller.state.litTechIds.push("super_hydro");
    controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "Jinsha River UHV Hydro Base",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 1800
    };
    const screen = createScreenRegionForRegion(controller, "MAP-06");

    const candidate = screen
      .getSnapshot()
      .linkCandidates.find(
        (item) =>
          item.fromCityId === "CITY-MAP06-01" &&
          item.toCityId === "SUPER-HYDRO-1" &&
          item.linkType === "trunk"
      );
    expect(candidate?.available).toBe(true);
    expect(candidate?.toCityName).toBe("Jinsha River UHV Hydro Base");

    const queue = screen.queueGridLink("CITY-MAP06-01", "SUPER-HYDRO-1", "trunk");
    expect(queue.result.ok).toBe(true);
  });

  it("hides building super hydro from trunk candidates", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 5;
    controller.state.litTechIds.push("super_hydro");
    controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "Jinsha River UHV Hydro Base",
      status: "building",
      monthsRemaining: 1,
      outputMw: 1800
    };
    const screen = createScreenRegionForRegion(controller, "MAP-06");

    expect(
      screen
        .getSnapshot()
        .linkCandidates.some(
          (item) => item.fromCityId === "CITY-MAP06-01" && item.toCityId === "SUPER-HYDRO-1"
        )
    ).toBe(false);
  });
});
