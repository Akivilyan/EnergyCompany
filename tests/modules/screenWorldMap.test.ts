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
      "planned"
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
});
