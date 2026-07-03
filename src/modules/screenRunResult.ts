import type { GameState } from "../sim/index.js";
import type { RunController } from "./runController.js";

export interface RunResultTerminalRouteSnapshot {
  metBUnlocked: boolean;
  metBConnected: boolean;
  metBSupplyGapMw: number | null;
  superHydroFinishedSlots: number;
  superHydroConnectedOutputMw: number;
  superHydroTotalOutputMw: number;
}

export interface RunResultSnapshot {
  month: number;
  runResult: Exclude<GameState["runResult"], null>;
  funds: number;
  companyLevel: number;
  socialValue: number;
  disastersTriggeredCount: number;
  finalDisasterTriggered: boolean;
  terminalRoute: RunResultTerminalRouteSnapshot;
  canRunPlayableCommands: false;
}

function linkKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export class ScreenRunResult {
  constructor(private readonly controller: RunController) {}

  getSnapshot(): RunResultSnapshot | null {
    const state = this.controller.state;
    if (state.runResult === null || state.phase !== "run_result") return null;
    const finalDisaster = this.controller.config.bundle.disasters.find((item) => item.is_final);
    const finalDisasterTriggered = finalDisaster
      ? state.disastersTriggered.includes(finalDisaster.seq)
      : false;
    const metBRegion = this.controller.config.bundle.regions.find((region) => region.region_id === "MET-B");
    const metBCities = this.controller.config.bundle.cities.filter((city) => city.region_id === "MET-B");
    const metBUnlocked = metBRegion ? state.companyLevel >= metBRegion.unlock_company_level : false;
    const metBCentralCity =
      metBCities.find((city) => city.city_type === "central") ?? metBCities[0] ?? null;
    const metBTrunk = metBCentralCity ? state.gridLinks[linkKey("CITY-START", metBCentralCity.city_id)] : null;
    const metBConnected = metBTrunk?.linkType === "trunk" && metBTrunk.status === "finished";
    const metBDemandMw = metBCities.reduce((sum, city) => {
      const runtime = state.cities[city.city_id];
      return sum + (runtime?.demandMw ?? city.base_demand_mw);
    }, 0);
    const metBEffectiveSupplyMw = metBCities.reduce((sum, city) => {
      const runtime = state.cities[city.city_id];
      return sum + (runtime?.effectiveSupplyMw ?? 0);
    }, 0);
    const superHydroSlots = Object.values(state.superHydros);
    const superHydroFinishedSlots = superHydroSlots.filter((slot) => slot.status === "finished").length;
    const superHydroTotalOutputMw = superHydroSlots
      .filter((slot) => slot.status === "finished")
      .reduce((sum, slot) => sum + slot.outputMw, 0);
    const superHydroConnectedOutputMw = superHydroSlots
      .filter((slot) =>
        Object.values(state.gridLinks).some(
          (link) =>
            link.status === "finished" &&
            link.linkType === "trunk" &&
            (link.fromCityId === slot.nodeId || link.toCityId === slot.nodeId)
        )
      )
      .reduce((sum, slot) => sum + slot.outputMw, 0);
    return {
      month: state.currentMonth,
      runResult: state.runResult,
      funds: state.funds,
      companyLevel: state.companyLevel,
      socialValue: state.socialValueCurrent,
      disastersTriggeredCount: state.disastersTriggered.length,
      finalDisasterTriggered,
      terminalRoute: {
        metBUnlocked,
        metBConnected,
        metBSupplyGapMw: metBCities.length > 0 ? Math.max(0, metBDemandMw - metBEffectiveSupplyMw) : null,
        superHydroFinishedSlots,
        superHydroConnectedOutputMw,
        superHydroTotalOutputMw
      },
      canRunPlayableCommands: false
    };
  }
}

export function createScreenRunResult(controller: RunController): ScreenRunResult {
  return new ScreenRunResult(controller);
}
