import type { ConfigRepo } from "../config/configRepo.js";
import type { GameState } from "../types/gameState.js";

export interface NewRunOptions {
  doctrineId?: GameState["doctrineId"];
  difficultyId?: GameState["difficultyId"];
  campaignId?: string;
}

export function createInitialState(
  config: ConfigRepo,
  options: NewRunOptions = {}
): GameState {
  const difficultyId = options.difficultyId ?? "simple";
  const startCity = config.getCity("CITY-START");
  if (!startCity) {
    throw new Error("config_missing: CITY-START");
  }

  const cities: GameState["cities"] = {
    [startCity.city_id]: {
      cityId: startCity.city_id,
      demandMw: startCity.base_demand_mw,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: startCity.city_base_social_value
    }
  };

  return {
    version: 1,
    runId: `run-${Date.now()}`,
    phase: "run_playable",
    playableSubPhase: "navigating",
    currentMonth: 1,
    funds: config.getStartingCash(difficultyId),
    companyLevel: 1,
    socialValueCurrent: 0,
    doctrineId: options.doctrineId ?? "tech",
    difficultyId,
    campaignId: options.campaignId ?? "main_v0",
    bankruptConsecutiveMonths: 0,
    runResult: null,
    cities,
    facilities: {},
    gridLinks: {},
    constructionQueue: [],
    researches: {},
    litTechIds: ["wind_1", "solar_1", "thermal_1", "hydro_1"],
    loans: {},
    activeDebuffs: [],
    disastersTriggered: [],
    adsRemaining: 10,
    incomePricePerMw: 1
  };
}
