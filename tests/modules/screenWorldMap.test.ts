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
    expect(map06?.totalBaseSocialValue).toBe(38);
    expect(map06?.richResources).toEqual(["wind", "solar"]);
    expect(metB?.centralCityId).toBe("CITY-METB-01");
    expect(metB?.totalDemandMw).toBe(2100);
    expect(metB?.totalBaseSocialValue).toBe(28);
    expect(metB?.richResources).toEqual(["solar", "hydro"]);
    expect(metB?.connectionStatus).toBe("available");
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
  });
});
