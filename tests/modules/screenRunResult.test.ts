import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenRunResult } from "../../src/modules/screenRunResult.js";


describe("ScreenRunResult", () => {
  it("returns null before run result phase", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenRunResult(controller);
    expect(screen.getSnapshot()).toBeNull();
  });

  it("supports victory snapshot", () => {
    const controller = createTestController(repoRoot);
    const finalDisaster = controller.config.bundle.disasters.find((d) => d.is_final);
    expect(finalDisaster).toBeTruthy();
    if (!finalDisaster) return;
    controller.state.currentMonth = controller.config.bundle.runConfig.campaign_run_target_months;
    controller.state.disastersTriggered.push(finalDisaster.seq);
    controller.state.funds = 10;
    controller.state.companyLevel = 5;
    controller.state.phase = "run_result";
    controller.state.runResult = "victory";
    controller.state.cities["CITY-START"].demandMw = 0;
    for (const city of controller.config.bundle.cities.filter((item) => item.region_id === "MET-B")) {
      controller.state.cities[city.city_id] = {
        cityId: city.city_id,
        demandMw: city.base_demand_mw,
        localSupplyMw: city.base_demand_mw,
        effectiveSupplyMw: city.base_demand_mw,
        netImportMw: 0,
        supplyRatio: 1,
        cityFullyEcoSupply: true,
        ecoCapFactor: 1,
        cityBaseSocialValue: city.city_base_social_value
      };
    }
    controller.state.gridLinks["CITY-METB-01::CITY-START"] = {
      linkId: "CITY-METB-01::CITY-START",
      fromCityId: "CITY-START",
      toCityId: "CITY-METB-01",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 250
    };
    controller.state.gridLinks["CITY-METB-01::SUPER-HYDRO-1"] = {
      linkId: "CITY-METB-01::SUPER-HYDRO-1",
      fromCityId: "CITY-METB-01",
      toCityId: "SUPER-HYDRO-1",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 250
    };
    controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "Jinsha River UHV Hydro Base",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 1800
    };
    const screen = createScreenRunResult(controller);
    const snapshot = screen.getSnapshot();
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;
    expect(snapshot.runResult).toBe("victory");
    expect(snapshot.finalDisasterTriggered).toBe(true);
    expect(snapshot.terminalRoute).toMatchObject({
      metBUnlocked: true,
      metBConnected: true,
      superHydroFinishedSlots: 1,
      superHydroConnectedOutputMw: 1800,
      superHydroTotalOutputMw: 1800
    });
    expect(snapshot.routeSummaryTokens).toEqual(["victory_route_complete"]);
    expect(snapshot.canRunPlayableCommands).toBe(false);
  });

  it("supports bankrupt snapshot", () => {
    const controller = createTestController(repoRoot);
    controller.state.funds = -100;
    controller.state.bankruptConsecutiveMonths =
      controller.config.bundle.runConfig.bankrupt_consecutive_months - 1;
    controller.state.cities["CITY-START"].demandMw = 0;
    const month = controller.runNextMonth();
    expect(month.ok).toBe(true);
    const screen = createScreenRunResult(controller);
    const snapshot = screen.getSnapshot();
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;
    expect(snapshot.runResult).toBe("bankrupt");
    expect(snapshot.terminalRoute.metBUnlocked).toBe(false);
    expect(snapshot.terminalRoute.superHydroConnectedOutputMw).toBe(0);
    expect(snapshot.routeSummaryTokens).toEqual([
      "bankrupt_cash_pressure",
      "metb_locked",
      "metb_supply_gap",
      "super_hydro_missing",
      "final_disaster_pending"
    ]);
    expect(snapshot.canRunPlayableCommands).toBe(false);
  });

  it("explains incomplete terminal route pieces", () => {
    const controller = createTestController(repoRoot);
    const finalDisaster = controller.config.bundle.disasters.find((d) => d.is_final);
    expect(finalDisaster).toBeTruthy();
    if (!finalDisaster) return;
    controller.state.phase = "run_result";
    controller.state.runResult = "bankrupt";
    controller.state.companyLevel = 5;
    controller.state.disastersTriggered.push(finalDisaster.seq);
    controller.state.gridLinks["CITY-METB-01::CITY-START"] = {
      linkId: "CITY-METB-01::CITY-START",
      fromCityId: "CITY-START",
      toCityId: "CITY-METB-01",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 250
    };
    controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "Jinsha River UHV Hydro Base",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 1800
    };

    const snapshot = createScreenRunResult(controller).getSnapshot();

    expect(snapshot?.routeSummaryTokens).toEqual([
      "bankrupt_cash_pressure",
      "metb_supply_gap",
      "super_hydro_isolated"
    ]);
  });

  it("handles restored legacy result state without super hydro runtime map", () => {
    const controller = createTestController(repoRoot);
    controller.state.phase = "run_result";
    controller.state.runResult = "bankrupt";
    delete (controller.state as Partial<typeof controller.state>).superHydros;

    const snapshot = createScreenRunResult(controller).getSnapshot();

    expect(snapshot?.terminalRoute.superHydroTotalOutputMw).toBe(0);
    expect(snapshot?.routeSummaryTokens).toContain("super_hydro_missing");
  });
});
