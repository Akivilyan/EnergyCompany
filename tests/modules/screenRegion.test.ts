import { describe, expect, it } from "vitest";
import type { RunController } from "../../src/modules/runController.js";
import { createScreenRegion } from "../../src/modules/screenRegion.js";
import { createTestController } from "../helpers/testRepo.js";

function addRuntimeCity(controller: RunController, cityId: string): void {
  const city = controller.config.getCity(cityId);
  if (!city) throw new Error(`missing ${cityId}`);
  controller.state.cities[cityId] = {
    cityId,
    demandMw: city.base_demand_mw,
    localSupplyMw: 0,
    effectiveSupplyMw: 0,
    netImportMw: 0,
    supplyRatio: 0,
    cityFullyEcoSupply: true,
    ecoCapFactor: 1,
    cityBaseSocialValue: city.city_base_social_value
  };
}

function prepareRegionalGrid(controller: RunController): void {
  controller.state.companyLevel = 3;
  controller.state.litTechIds.push("grid_regional");
  addRuntimeCity(controller, "CITY-MAP01-02");
}

describe("ScreenRegion PLAYABLE-CORE-04", () => {
  it("exposes all same-region level-II cities as operable navigation targets", () => {
    const controller = createTestController();
    controller.state.companyLevel = 2;
    const screen = createScreenRegion(controller);

    const advanced = screen.advanceMonths(1);
    expect(advanced.failed).toBeNull();
    expect(
      screen.getSnapshot().cities
        .filter((city) => city.operable)
        .map((city) => [city.cityId, city.buildSlotCount])
    ).toEqual([
      ["CITY-MAP01-02", 4],
      ["CITY-MAP01-03", 3],
      ["CITY-START", 7]
    ]);
  });

  it("keeps the regional entry locked until company III and grid_regional are both ready", () => {
    const controller = createTestController();
    const screen = createScreenRegion(controller);

    expect(screen.getSnapshot()).toMatchObject({
      canOpen: false,
      entryGate: "company_level_3",
      regionalTechLit: false
    });

    controller.state.companyLevel = 3;
    expect(screen.getSnapshot()).toMatchObject({
      canOpen: false,
      entryGate: "grid_regional",
      regionalTechLit: false
    });

    controller.state.litTechIds.push("grid_regional");
    expect(screen.getSnapshot()).toMatchObject({
      canOpen: true,
      entryGate: "open",
      regionalTechLit: true
    });
  });

  it("rejects a regional link when the technology gate is missing", () => {
    const controller = createTestController();
    controller.state.companyLevel = 3;
    addRuntimeCity(controller, "CITY-MAP01-02");
    const screen = createScreenRegion(controller);

    const candidate = screen.getSnapshot().linkCandidates.find(
      (item) => item.toCityId === "CITY-MAP01-02" && item.linkType === "region"
    );
    expect(candidate).toMatchObject({ unlocked: false, available: false });

    const action = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(action.result.ok).toBe(false);
    if (!action.result.ok) expect(action.result.error).toBe("not_unlocked");
  });

  it("exposes the representative two-city plan with rule-owned cost and loss", () => {
    const controller = createTestController();
    prepareRegionalGrid(controller);
    const snapshot = createScreenRegion(controller).getSnapshot();
    const candidate = snapshot.linkCandidates.find(
      (item) => item.toCityId === "CITY-MAP01-02" && item.linkType === "region"
    );

    expect(snapshot.cities.find((city) => city.cityId === "CITY-MAP01-02")).toMatchObject({
      operable: true,
      demandMw: 520,
      netImportMw: 0
    });
    expect(candidate).toMatchObject({
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP01-02",
      cost: 6,
      lossMw: 125,
      unlocked: true,
      available: true
    });
  });

  it("keeps a building link inactive, then finishes it and applies one island satisfaction rate", () => {
    const controller = createTestController();
    prepareRegionalGrid(controller);
    controller.state.facilities["fac-regional-source"] = {
      id: "fac-regional-source",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0,
      isEco: true,
      slotId: "slot-1"
    };
    expect(controller.runNextMonth().ok).toBe(true);
    const screen = createScreenRegion(controller);
    const isolated = screen.getSnapshot();
    expect(isolated.cities.find((city) => city.cityId === "CITY-START")?.supplyRatio).toBe(0.69);
    expect(isolated.cities.find((city) => city.cityId === "CITY-MAP01-02")?.supplyRatio).toBe(0);

    const queued = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(queued.result.ok).toBe(true);
    expect(queued.after.funds).toBe(queued.before.funds - 6);
    expect(queued.after.gridLinks[0]).toMatchObject({
      status: "building",
      monthsRemaining: 1,
      lossMw: 125,
      buildCost: 6
    });
    expect(queued.after.cities.find((city) => city.cityId === "CITY-MAP01-02")?.supplyRatio).toBe(0);

    const advanced = screen.advanceOneMonth();
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const start = advanced.value.after.cities.find((city) => city.cityId === "CITY-START");
    const second = advanced.value.after.cities.find((city) => city.cityId === "CITY-MAP01-02");
    expect(advanced.value.after.gridLinks[0]).toMatchObject({
      status: "finished",
      monthsRemaining: 0,
      lossMw: 125
    });
    expect(start?.supplyRatio).toBe(0.43);
    expect(second?.supplyRatio).toBe(0.43);
    expect(start?.netImportMw).toBeLessThan(0);
    expect(second?.netImportMw).toBeGreaterThan(0);
  });
});
