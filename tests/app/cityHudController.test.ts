import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, setLocale } from "../../src/i18n/index.js";
import {
  cityHudAdvanceMonth,
  cityHudBuildSelected,
  cityHudBuildWind,
  cityHudCycleBuildCandidate,
  formatSelectedBuildCandidate,
  formatCityHudStatus,
  getCityHudProfileSnapshot,
  getCityHudBuildSelectionSnapshot,
  readCityHudViewModel
} from "../../src/app/cityHudController.js";
import { clientNavOpenCity } from "../../src/app/screenNavController.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import {
  clearMountedGameClient,
  getMountedGameClient,
  onGameClientMounted,
  setMountedGameClient
} from "../../src/app/gameClientRegistry.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";


describe("cityHudController", () => {
  beforeEach(() => {
    setLocale(DEFAULT_LOCALE);
  });

  it("reads view model from mounted bootstrap", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, sceneHost: new LoggingSceneHost(), autoResumeSlot: false });
    const view = readCityHudViewModel(boot);
    expect(view.month).toBe(1);
    expect(view.funds).toBeGreaterThan(0);
    expect(view.cityId).toBe("CITY-START");
    expect(view.screen).toBe("screen_city_detail");
    expect(formatCityHudStatus(view)).toContain("第1月");
  });

  it("builds wind and advances month through play surface", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const build = cityHudBuildWind(boot);
    expect(build.ok).toBe(true);
    expect(build.view.funds).toBeLessThan(203);

    const advance = cityHudAdvanceMonth(boot);
    expect(advance.ok).toBe(true);
    expect(advance.monthFrom).toBe(1);
    expect(advance.monthTo).toBe(2);
    expect(advance.view.month).toBe(2);
  });

  it("cycles city build candidates and builds selected solar candidate", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const initial = getCityHudBuildSelectionSnapshot(boot);
    expect(initial.selectedFacilityId).toBe("wind");

    const cycle = cityHudCycleBuildCandidate(boot);
    expect(cycle.ok).toBe(true);
    expect(cycle.messageKey).toBe("city.action.selected_next_candidate");

    const selected = formatSelectedBuildCandidate(boot);
    expect(selected).toContain("光伏");

    const build = cityHudBuildSelected(boot);
    expect(build.ok).toBe(true);
    expect(build.view.funds).toBeLessThan(203);
  });

  it("uses the highest lit wind tier for selected city build candidate", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    boot.app.controller.state.companyLevel = 2;
    boot.app.controller.state.litTechIds.push("wind_2");

    const snapshot = getCityHudBuildSelectionSnapshot(boot);
    const wind = snapshot.candidates.find((candidate) => candidate.facilityId === "wind");
    expect(wind?.tier).toBe(2);
    expect(wind?.displayName).toContain("II");
    expect(wind?.buildCost).toBe(24);

    const build = cityHudBuildSelected(boot, "wind");
    expect(build.ok).toBe(true);
    expect(boot.app.controller.state.constructionQueue[0]?.tier).toBe(2);
  });

  it("exposes resource and storage multipliers on build candidates", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const metB = config.getCity("CITY-METB-01");
    expect(metB).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("storage_system_1");
    boot.app.controller.state.cities["CITY-METB-01"] = {
      cityId: "CITY-METB-01",
      demandMw: metB?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: metB?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-METB-01", "MET-B");

    const snapshot = getCityHudBuildSelectionSnapshot(boot);
    const solar = snapshot.candidates.find((candidate) => candidate.facilityId === "solar");

    expect(solar?.resourceMultiplier).toBe(2);
    expect(solar?.storageMultiplier).toBe(2);
    expect(solar?.effectiveOutputMw).toBe((solar?.outputMw ?? 0) * 4);
  });

  it("exposes city operating profile for level-V city HUD", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const map06 = config.getCity("CITY-MAP06-01");
    expect(map06).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.cities["CITY-MAP06-01"] = {
      cityId: "CITY-MAP06-01",
      demandMw: map06?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map06?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-MAP06-01", "MAP-06");

    expect(getCityHudProfileSnapshot(boot)).toEqual({
      demandMw: 1280,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      supplyGapMw: 1280,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      greenPrActive: false,
      buildSlots: 6,
      hasRiver: false,
      nuclearEligible: true,
      richResources: ["solar", "fossil"],
      operatingPressureTags: [
        "high_demand",
        "supply_gap",
        "trunk_first",
        "low_slot_density",
        "no_hydro",
        "fossil_transition",
        "nuclear_siting"
      ],
      powerRole: "coastal_industrial_hub"
    });
  });

  it("prefers pressure-aligned build candidates for late-map cities", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const map06 = config.getCity("CITY-MAP06-01");
    expect(map06).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.cities["CITY-MAP06-01"] = {
      cityId: "CITY-MAP06-01",
      demandMw: map06?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map06?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-MAP06-01", "MAP-06");

    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("solar");

    const cycle = cityHudCycleBuildCandidate(boot);
    expect(cycle.ok).toBe(true);
    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("thermal");
  });

  it("prefers hydro for a mid-game river city with hydro pressure", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const map03 = config.getCity("CITY-MAP03-01");
    expect(map03).toBeTruthy();
    boot.app.controller.state.companyLevel = 3;
    boot.app.controller.state.cities["CITY-MAP03-01"] = {
      cityId: "CITY-MAP03-01",
      demandMw: map03?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map03?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-MAP03-01", "MAP-03");

    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("hydro");
  });

  it("keeps remembered build candidate scoped per city", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const map07 = config.getCity("CITY-MAP07-01");
    expect(map07).toBeTruthy();
    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("wind");
    expect(cityHudCycleBuildCandidate(boot).ok).toBe(true);
    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("solar");

    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.cities["CITY-MAP07-01"] = {
      cityId: "CITY-MAP07-01",
      demandMw: map07?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map07?.city_base_social_value ?? 0
    };

    clientNavOpenCity(boot, "CITY-MAP07-01", "MAP-07");
    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("hydro");
  });

  it("exposes nuclear as a mid-game candidate after nuclear tech is lit", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const map02 = config.getCity("CITY-MAP02-01");
    expect(map02).toBeTruthy();
    boot.app.controller.state.companyLevel = 3;
    boot.app.controller.state.litTechIds.push("nuclear_1");
    boot.app.controller.state.cities["CITY-MAP02-01"] = {
      cityId: "CITY-MAP02-01",
      demandMw: map02?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map02?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-MAP02-01", "MAP-02");

    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("hydro");

    const cycle = cityHudCycleBuildCandidate(boot);
    expect(cycle.ok).toBe(true);
    expect(getCityHudBuildSelectionSnapshot(boot).selectedFacilityId).toBe("nuclear");
  });

  it("exposes city eco and green brand status for city HUD", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const start = config.getCity("CITY-START");
    expect(start).toBeTruthy();
    boot.app.controller.state.cities["CITY-START"] = {
      cityId: "CITY-START",
      demandMw: start?.base_demand_mw ?? 0,
      localSupplyMw: 100,
      effectiveSupplyMw: 100,
      netImportMw: 0,
      supplyRatio: 100 / (start?.base_demand_mw ?? 1),
      cityFullyEcoSupply: false,
      ecoCapFactor: 0.8,
      cityBaseSocialValue: start?.city_base_social_value ?? 0
    };

    expect(getCityHudProfileSnapshot(boot)?.cityFullyEcoSupply).toBe(false);
    expect(getCityHudProfileSnapshot(boot)?.ecoCapFactor).toBe(0.8);
    expect(getCityHudProfileSnapshot(boot)?.greenPrActive).toBe(false);

    boot.app.controller.state.cities["CITY-START"].cityFullyEcoSupply = true;
    boot.app.controller.state.cities["CITY-START"].ecoCapFactor = 1;
    boot.app.controller.state.litTechIds.push("eng_green_pr");

    expect(getCityHudProfileSnapshot(boot)?.greenPrActive).toBe(true);
  });

  it("exposes late-map city role pressure for MAP-07 and MAP-08 city HUD", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const map07 = config.getCity("CITY-MAP07-01");
    const map08 = config.getCity("CITY-MAP08-01");
    expect(map07).toBeTruthy();
    expect(map08).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;

    boot.app.controller.state.cities["CITY-MAP07-01"] = {
      cityId: "CITY-MAP07-01",
      demandMw: map07?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map07?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-MAP07-01", "MAP-07");
    expect(getCityHudProfileSnapshot(boot)?.operatingPressureTags).toEqual([
      "supply_gap",
      "trunk_first",
      "low_slot_density",
      "hydro_site_bound"
    ]);

    boot.app.controller.state.cities["CITY-MAP08-01"] = {
      cityId: "CITY-MAP08-01",
      demandMw: map08?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map08?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-MAP08-01", "MAP-08");
    expect(getCityHudProfileSnapshot(boot)?.operatingPressureTags).toEqual([
      "high_demand",
      "supply_gap",
      "trunk_first",
      "low_slot_density",
      "nuclear_siting",
      "mixed_dispatch"
    ]);
  });

  it("exposes MET-B terminal load pressure for city HUD", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const metB = config.getCity("CITY-METB-01");
    expect(metB).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.cities["CITY-METB-01"] = {
      cityId: "CITY-METB-01",
      demandMw: metB?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: metB?.city_base_social_value ?? 0
    };
    clientNavOpenCity(boot, "CITY-METB-01", "MET-B");

    expect(getCityHudProfileSnapshot(boot)?.operatingPressureTags).toEqual([
      "high_demand",
      "supply_gap",
      "trunk_first",
      "low_slot_density",
      "nuclear_siting",
      "terminal_load"
    ]);

    boot.app.controller.state.gridLinks["CITY-METB-01::CITY-START"] = {
      linkId: "CITY-METB-01::CITY-START",
      fromCityId: "CITY-METB-01",
      toCityId: "CITY-START",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 500
    };
    expect(getCityHudProfileSnapshot(boot)?.operatingPressureTags).toEqual([
      "high_demand",
      "supply_gap",
      "low_slot_density",
      "nuclear_siting",
      "terminal_load"
    ]);
  });

  it("hides build candidates for unlocked outside-region city before trunk connection", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenCity(boot, "CITY-MAP02-01", "MAP-02");

    const before = getCityHudBuildSelectionSnapshot(boot);
    expect(before.candidates).toHaveLength(0);

    const queue = boot.app.screens.region("MAP-02").queueGridLink("CITY-MAP02-01", "CITY-START", "trunk");
    expect(queue.result.ok).toBe(true);
    const month = boot.app.controller.runNextMonth();
    expect(month.ok).toBe(true);

    const after = getCityHudBuildSelectionSnapshot(boot);
    expect(after.candidates.some((candidate) => candidate.facilityId === "wind")).toBe(true);
  });
});

describe("gameClientRegistry", () => {
  it("notifies mount listeners and supports lookup", () => {
    clearMountedGameClient();
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const seen: number[] = [];
    const unbind = onGameClientMounted(() => {
      seen.push(1);
    });

    setMountedGameClient(boot);
    expect(getMountedGameClient()).toBe(boot);
    expect(seen).toEqual([1]);

    unbind();
    clearMountedGameClient();
    expect(getMountedGameClient()).toBeNull();
  });
});
