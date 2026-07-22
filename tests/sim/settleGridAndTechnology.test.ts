import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo, createInitialState, dispatch, settleNextMonth, defaultPorts } from "../../src/sim/index.js";
import { syncOperableCities } from "../../src/sim/core/settleNextMonth.js";
import { getFacilityTierSpec } from "../../src/sim/core/technologyEffects.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import type { GameState } from "../../src/sim/index.js";

describe("grid supply and technology effects", () => {
  function withCity(state: GameState, config: ConfigRepo, cityId: string): GameState {
    const city = config.getCity(cityId);
    if (!city) {
      throw new Error(`missing ${cityId}`);
    }
    state.cities[city.city_id] = {
      cityId: city.city_id,
      demandMw: city.base_demand_mw,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: city.city_base_social_value
    };
    return state;
  }

  function withSecondCity(state: GameState, config: ConfigRepo): GameState {
    return withCity(state, config, "CITY-MAP01-02");
  }

  it("M4 uses unified island rate when two cities are connected in v0", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("grid_regional");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    const link = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(link.ok).toBe(true);
    if (!link.ok) return;
    state = link.value.state;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    const next = month.value.state;
    expect(next.cities["CITY-START"].supplyRatio).toBe(0.43);
    expect(next.cities["CITY-MAP01-02"].supplyRatio).toBe(0.43);
    expect(next.cities["CITY-MAP01-02"].netImportMw).toBeGreaterThan(0);
  });

  it("M4 subtracts finished grid link losses from island supply", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("grid_regional");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    const link = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(link.ok).toBe(true);
    if (!link.ok) return;
    state = link.value.state;
    state.gridLinks["CITY-MAP01-02::CITY-START"].lossMw = 0;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.gridLinks["CITY-MAP01-02::CITY-START"]?.lossMw).toBe(125);
    expect(month.value.state.cities["CITY-START"].effectiveSupplyMw).toBe(570);
    expect(month.value.state.cities["CITY-MAP01-02"].effectiveSupplyMw).toBe(224);
  });

  it("refreshes existing region links with smart dispatch loss reduction during settle", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("eng_grid_dispatch");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.gridLinks["CITY-MAP01-02::CITY-START"] = {
      linkId: "CITY-MAP01-02::CITY-START",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP01-02",
      linkType: "region",
      status: "finished",
      monthsRemaining: 0,
      lossMw: config.bundle.gridLoss.loss_regional_mw
    };

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.gridLinks["CITY-MAP01-02::CITY-START"]?.lossMw).toBe(112);
    expect(month.value.state.cities["CITY-START"].effectiveSupplyMw).toBe(579);
    expect(month.value.state.cities["CITY-MAP01-02"].effectiveSupplyMw).toBe(228);
  });

  it("M4 keeps cities isolated when no finished link exists", () => {
    const config = loadTestConfig();
    const state = withSecondCity(createInitialState(config), config);
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    const next = month.value.state;
    expect(next.cities["CITY-START"].supplyRatio).toBe(0.69);
    expect(next.cities["CITY-MAP01-02"].supplyRatio).toBe(0);
    expect(next.cities["CITY-MAP01-02"].netImportMw).toBe(0);
  });

  it("M4 only grants storage output boost from storage_system_1", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.litTechIds.push("storage_system_2");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-START"].localSupplyMw).toBe(420);
  });

  it("M4 and M5 apply storage_system_1 as a positive renewable output boost", () => {
    const config = loadTestConfig();
    const baseState = createInitialState(config);
    baseState.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    const storageState = structuredClone(baseState);
    storageState.litTechIds.push("storage_system_1");

    const baseMonth = settleNextMonth(baseState, config, defaultPorts);
    const storageMonth = settleNextMonth(storageState, config, defaultPorts);

    expect(baseMonth.ok).toBe(true);
    expect(storageMonth.ok).toBe(true);
    if (!baseMonth.ok || !storageMonth.ok) return;
    const baseIncome =
      baseMonth.value.report.steps.find((step) => step.stepId === "M5_income_settlement")?.metrics.income ??
      0;
    const storageIncome =
      storageMonth.value.report.steps.find((step) => step.stepId === "M5_income_settlement")?.metrics.income ??
      0;
    expect(baseMonth.value.state.cities["CITY-START"].localSupplyMw).toBe(420);
    expect(storageMonth.value.state.cities["CITY-START"].localSupplyMw).toBe(840);
    expect(storageIncome).toBeGreaterThan(baseIncome);
  });

  it("M4 applies rich city resource multipliers to wind solar and hydro only", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    withCity(state, config, "CITY-METB-01");
    withCity(state, config, "CITY-MAP07-01");
    withCity(state, config, "CITY-MAP07-03");
    state.facilities["fac-metb-solar"] = {
      id: "fac-metb-solar",
      cityId: "CITY-METB-01",
      facilityId: "solar",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-metb-nuclear"] = {
      id: "fac-metb-nuclear",
      cityId: "CITY-METB-01",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-map07-hydro"] = {
      id: "fac-map07-hydro",
      cityId: "CITY-MAP07-01",
      facilityId: "hydro",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-map07-wind"] = {
      id: "fac-map07-wind",
      cityId: "CITY-MAP07-03",
      facilityId: "wind",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-METB-01"].localSupplyMw).toBe(300);
    expect(month.value.state.cities["CITY-MAP07-01"].localSupplyMw).toBe(200);
    expect(month.value.state.cities["CITY-MAP07-03"].localSupplyMw).toBe(200);
  });

  it("M3 upgrades existing wind facilities to tier 2 when wind_2 lights", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 42,
      monthlyOpex: 1,
      monthlyFuel: 0
    };
    state.researches["wind_2"] = {
      researchId: "rq-1-wind_2",
      techId: "wind_2",
      monthsRemaining: 1
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.litTechIds).toContain("wind_2");
    expect(month.value.state.facilities["fac-a"]?.tier).toBe(2);
    expect(month.value.state.facilities["fac-a"]?.outputMw).toBe(84);
    expect(month.value.state.facilities["fac-a"]?.monthlyOpex).toBe(2);
  });

  it("M3 syncs existing late-tier wind and nuclear facilities after level-V tech lights", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 5;
    state.facilities["fac-wind"] = {
      id: "fac-wind",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 2,
      outputMw: 84,
      monthlyOpex: 2,
      monthlyFuel: 0
    };
    state.facilities["fac-nuclear"] = {
      id: "fac-nuclear",
      cityId: "CITY-START",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 12,
      monthlyFuel: 0
    };
    state.researches["wind_5"] = {
      researchId: "rq-1-wind_5",
      techId: "wind_5",
      monthsRemaining: 1
    };
    state.litTechIds.push("nuclear_3");

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.litTechIds).toContain("wind_5");
    expect(month.value.state.facilities["fac-wind"]?.tier).toBe(5);
    expect(month.value.state.facilities["fac-wind"]?.outputMw).toBe(210);
    expect(month.value.state.facilities["fac-wind"]?.monthlyOpex).toBe(5);
    expect(month.value.state.facilities["fac-nuclear"]?.tier).toBe(3);
    expect(month.value.state.facilities["fac-nuclear"]?.outputMw).toBe(1260);
    expect(month.value.state.facilities["fac-nuclear"]?.monthlyOpex).toBe(36);
    expect(
      month.value.report.steps.find((step) => step.stepId === "M6_opex_settlement")?.metrics.opex
    ).toBe(41);
  });

  it("M3 syncs existing late-tier solar hydro and thermal facilities after level-V tech lights", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 5;
    for (const facilityId of ["solar", "hydro", "thermal"] as const) {
      state.facilities[`fac-${facilityId}`] = {
        id: `fac-${facilityId}`,
        cityId: "CITY-START",
        facilityId,
        tier: 1,
        outputMw: 1,
        monthlyOpex: 1,
        monthlyFuel: 0
      };
    }
    state.researches["solar_5"] = {
      researchId: "rq-1-solar_5",
      techId: "solar_5",
      monthsRemaining: 1
    };
    state.litTechIds.push("hydro_5", "thermal_5");

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.litTechIds).toContain("solar_5");

    const solarSpec = getFacilityTierSpec(config, "solar", 5);
    const hydroSpec = getFacilityTierSpec(config, "hydro", 5);
    const thermalSpec = getFacilityTierSpec(config, "thermal", 5);
    expect(solarSpec).toBeTruthy();
    expect(hydroSpec).toBeTruthy();
    expect(thermalSpec).toBeTruthy();
    if (!solarSpec || !hydroSpec || !thermalSpec) return;

    expect(month.value.state.facilities["fac-solar"]?.tier).toBe(solarSpec.tier);
    expect(month.value.state.facilities["fac-solar"]?.outputMw).toBe(solarSpec.outputMw);
    expect(month.value.state.facilities["fac-solar"]?.monthlyOpex).toBe(solarSpec.monthlyOpex);
    expect(month.value.state.facilities["fac-solar"]?.monthlyFuel).toBe(solarSpec.monthlyFuel);
    expect(month.value.state.facilities["fac-hydro"]?.tier).toBe(hydroSpec.tier);
    expect(month.value.state.facilities["fac-hydro"]?.outputMw).toBe(hydroSpec.outputMw);
    expect(month.value.state.facilities["fac-hydro"]?.monthlyOpex).toBe(hydroSpec.monthlyOpex);
    expect(month.value.state.facilities["fac-hydro"]?.monthlyFuel).toBe(hydroSpec.monthlyFuel);
    expect(month.value.state.facilities["fac-thermal"]?.tier).toBe(thermalSpec.tier);
    expect(month.value.state.facilities["fac-thermal"]?.outputMw).toBe(thermalSpec.outputMw);
    expect(month.value.state.facilities["fac-thermal"]?.monthlyOpex).toBe(thermalSpec.monthlyOpex);
    expect(month.value.state.facilities["fac-thermal"]?.monthlyFuel).toBe(thermalSpec.monthlyFuel);
    expect(
      month.value.report.steps.find((step) => step.stepId === "M6_opex_settlement")?.metrics.opex
    ).toBe(solarSpec.monthlyOpex + hydroSpec.monthlyOpex + thermalSpec.monthlyOpex);
    expect(
      month.value.report.steps.find((step) => step.stepId === "M7_fuel_settlement")?.metrics.fuel
    ).toBe(thermalSpec.monthlyFuel);
  });

  it("dispatch rejects region link across different regions", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP02-01");
    state.companyLevel = 3;
    state.litTechIds.push("grid_regional");
    const out = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP02-01",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toBe("invalid_command_payload");
    expect(out.message).toContain("same region");
  });

  it("dispatch allows trunk link across different regions", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP02-01");
    state.companyLevel = 3;
    const out = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP02-01",
        linkType: "trunk"
      },
      config,
      defaultPorts
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const key = "CITY-MAP02-01::CITY-START";
    expect(out.value.state.gridLinks[key]?.linkType).toBe("trunk");
  });

  it("dispatch rejects trunk link inside same region", () => {
    const config = loadTestConfig();
    const state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 2;
    const out = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "trunk"
      },
      config,
      defaultPorts
    );
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toBe("invalid_command_payload");
    expect(out.message).toContain("different regions");
  });

  it("M4 marks city non-eco even with net import", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("grid_regional");
    state.facilities["fac-thermal"] = {
      id: "fac-thermal",
      cityId: "CITY-START",
      facilityId: "thermal",
      tier: 1,
      outputMw: 220,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-wind"] = {
      id: "fac-wind",
      cityId: "CITY-MAP01-02",
      facilityId: "wind",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    const link = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(link.ok).toBe(true);
    if (!link.ok) return;
    state = link.value.state;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    const next = month.value.state;
    expect(next.cities["CITY-START"].netImportMw).toBeGreaterThan(0);
    expect(next.cities["CITY-START"].cityFullyEcoSupply).toBe(false);
    expect(next.cities["CITY-START"].ecoCapFactor).toBe(0.8);
  });

  it("M3 eco_thermal completion immediately eco-syncs existing thermal facilities", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 4;
    state.facilities["fac-thermal"] = {
      id: "fac-thermal",
      cityId: "CITY-START",
      facilityId: "thermal",
      tier: 1,
      outputMw: 220,
      monthlyOpex: 6,
      monthlyFuel: 3
    };
    state.researches["eco_thermal"] = {
      researchId: "rq-eco-thermal",
      techId: "eco_thermal",
      monthsRemaining: 1
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.litTechIds).toContain("eco_thermal");
    expect(month.value.state.facilities["fac-thermal"]?.isEco).toBe(true);
    expect(month.value.state.cities["CITY-START"].cityFullyEcoSupply).toBe(true);
    expect(month.value.state.cities["CITY-START"].ecoCapFactor).toBe(1);
  });

});
