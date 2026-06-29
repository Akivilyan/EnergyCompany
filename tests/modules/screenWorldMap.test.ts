import { describe, expect, it } from "vitest";
import { createTestController } from "../helpers/testRepo.js";
import { createScreenWorldMap } from "../../src/modules/screenWorldMap.js";

describe("screenWorldMap", () => {
  it("shows unlocked regions and next unlock", () => {
    const controller = createTestController();
    controller.state.companyLevel = 3;

    const snapshot = createScreenWorldMap(controller).getSnapshot();

    expect(snapshot.unlockedRegions).toBe(3);
    expect(snapshot.nextUnlockRegion?.regionId).toBe("MAP-03");
    expect(snapshot.regions.find((region) => region.regionId === "MAP-02")?.connectionStatus).toBe(
      "available"
    );
    expect(snapshot.regions.find((region) => region.regionId === "MET-A")?.connectionStatus).toBe(
      "available"
    );
  });

  it("shows building trunk state once queued", () => {
    const controller = createTestController();
    controller.state.companyLevel = 3;

    const queued = controller.runCommand({
      type: "queue_grid_link",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP02-01",
      linkType: "trunk"
    });
    expect(queued.ok).toBe(true);

    const snapshot = createScreenWorldMap(controller).getSnapshot();
    expect(snapshot.buildingTrunks).toBe(1);
    expect(snapshot.regions.find((region) => region.regionId === "MAP-02")?.connectionStatus).toBe(
      "building"
    );
  });

  it("shows all level-V regions unlocked and metropolis-b ready as late-demo target", () => {
    const controller = createTestController();
    controller.state.companyLevel = 5;

    const snapshot = createScreenWorldMap(controller).getSnapshot();
    const map06 = snapshot.regions.find((region) => region.regionId === "MAP-06");
    const metB = snapshot.regions.find((region) => region.regionId === "MET-B");

    expect(snapshot.unlockedRegions).toBe(10);
    expect(snapshot.nextUnlockRegion).toBeNull();
    expect(map06?.totalDemandMw).toBe(1920);
    expect(map06?.designRole).toBe("coastal_industrial_export_province");
    expect(map06?.totalLocalSupplyMw).toBe(0);
    expect(map06?.totalNetImportMw).toBe(0);
    expect(map06?.totalEffectiveSupplyMw).toBe(0);
    expect(map06?.supplyGapMw).toBe(1920);
    expect(map06?.totalBuildSlots).toBe(13);
    expect(map06?.riverCityCount).toBe(0);
    expect(map06?.nuclearEligibleCityCount).toBe(1);
    expect(map06?.supplyRatio).toBe(0);
    expect(map06?.totalBaseSocialValue).toBe(38);
    expect(map06?.richResources).toEqual(["wind", "solar", "fossil"]);
    expect(map06?.recommendedBuilds).toEqual(["wind", "solar", "thermal", "nuclear"]);
    expect(metB?.centralCityId).toBe("CITY-METB-01");
    expect(metB?.designRole).toBe("terminal_metropolis_load_hub");
    expect(metB?.totalDemandMw).toBe(2100);
    expect(metB?.totalLocalSupplyMw).toBe(0);
    expect(metB?.totalNetImportMw).toBe(0);
    expect(metB?.totalEffectiveSupplyMw).toBe(0);
    expect(metB?.supplyGapMw).toBe(2100);
    expect(metB?.totalBuildSlots).toBe(7);
    expect(metB?.riverCityCount).toBe(1);
    expect(metB?.nuclearEligibleCityCount).toBe(1);
    expect(metB?.totalBaseSocialValue).toBe(28);
    expect(metB?.richResources).toEqual(["solar", "hydro"]);
    expect(metB?.recommendedBuilds).toEqual(["solar", "hydro", "nuclear"]);
    expect(metB?.connectionStatus).toBe("available");
  });

  it("keeps level-V province build recommendations differentiated", () => {
    const controller = createTestController();
    controller.state.companyLevel = 5;

    const snapshot = createScreenWorldMap(controller).getSnapshot();

    expect(snapshot.regions.find((region) => region.regionId === "MAP-06")?.recommendedBuilds).toEqual([
      "wind",
      "solar",
      "thermal",
      "nuclear"
    ]);
    expect(snapshot.regions.find((region) => region.regionId === "MAP-07")?.recommendedBuilds).toEqual([
      "wind",
      "solar",
      "hydro"
    ]);
    expect(snapshot.regions.find((region) => region.regionId === "MAP-08")?.recommendedBuilds).toEqual([
      "wind",
      "solar",
      "hydro",
      "nuclear"
    ]);
  });

  it("summarizes regional effective supply from runtime city state", () => {
    const controller = createTestController();
    controller.state.companyLevel = 5;
    controller.state.cities["CITY-MAP06-01"] = {
      cityId: "CITY-MAP06-01",
      demandMw: 1280,
      localSupplyMw: 210,
      effectiveSupplyMw: 420,
      netImportMw: 210,
      supplyRatio: 0.5,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: 18
    };

    const snapshot = createScreenWorldMap(controller).getSnapshot();
    const map06 = snapshot.regions.find((region) => region.regionId === "MAP-06");

    expect(map06?.totalDemandMw).toBe(1920);
    expect(map06?.totalLocalSupplyMw).toBe(210);
    expect(map06?.totalNetImportMw).toBe(210);
    expect(map06?.totalEffectiveSupplyMw).toBe(420);
    expect(map06?.supplyGapMw).toBe(1500);
    expect(map06?.supplyRatio).toBeCloseTo(420 / 1920);
  });

  it("shows level-V super hydro slots once the tech is lit", () => {
    const controller = createTestController();
    controller.state.companyLevel = 5;
    controller.state.litTechIds.push("super_hydro");
    controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "超级水电一号槽",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 4200
    };

    const snapshot = createScreenWorldMap(controller).getSnapshot();

    expect(snapshot.superHydro.unlocked).toBe(true);
    expect(snapshot.superHydro.totalSlots).toBe(2);
    expect(snapshot.superHydro.finishedSlots).toBe(1);
    expect(snapshot.superHydro.availableSlots).toBe(1);
    expect(snapshot.superHydro.totalOutputMw).toBe(4200);
    expect(snapshot.superHydro.connectedOutputMw).toBe(0);
    expect(snapshot.superHydro.slots.find((slot) => slot.slotId === "super_hydro_1")?.gridConnectionStatus).toBe(
      "isolated"
    );
  });

  it("counts only grid-connected super hydro output as connected output", () => {
    const controller = createTestController();
    controller.state.companyLevel = 5;
    controller.state.litTechIds.push("super_hydro");
    controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "超级水电一号槽",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 4200
    };
    controller.state.gridLinks["CITY-MAP06-01::SUPER-HYDRO-1"] = {
      linkId: "CITY-MAP06-01::SUPER-HYDRO-1",
      fromCityId: "CITY-MAP06-01",
      toCityId: "SUPER-HYDRO-1",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 500
    };

    const snapshot = createScreenWorldMap(controller).getSnapshot();

    expect(snapshot.superHydro.totalOutputMw).toBe(4200);
    expect(snapshot.superHydro.connectedOutputMw).toBe(4200);
    expect(snapshot.superHydro.slots.find((slot) => slot.slotId === "super_hydro_1")?.gridConnectionStatus).toBe(
      "connected"
    );
  });
});
