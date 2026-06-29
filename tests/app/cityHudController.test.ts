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
    expect(build.view.funds).toBeLessThan(140);

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
    expect(build.view.funds).toBeLessThan(140);
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
      buildSlots: 6,
      hasRiver: false,
      nuclearEligible: true,
      richResources: ["solar", "fossil"],
      powerRole: "coastal_industrial_hub"
    });
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
