#!/usr/bin/env node
/**
 * FAST-01 city construction branch smoke.
 *
 * Verifies that mid/late demo city construction branches are playable through
 * the client HUD surface: candidates appear, selected actions queue the real
 * facility, and tier/resource/storage modifiers are reflected before build.
 */
import {
  cityHudBuildSelected,
  getCityHudBuildSelectionSnapshot,
  getCityHudProfileSnapshot
} from "./cityHudController.js";
import { mountGameClient } from "./gameClientEntry.js";
import { clientNavOpenCity } from "./screenNavController.js";
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import type { GameBootstrap } from "./gameBootstrap.js";
import type { GameState } from "../sim/index.js";

interface BranchCheck {
  id: string;
  detail: string;
}

interface BuildCase {
  id: string;
  cityId: string;
  regionId: string;
  facilityId: string;
  expectedTier: number;
  expectedResourceMultiplier: number;
  expectedStorageMultiplier: number;
  expectedSelectedFacilityId?: string;
  expectedPressureTags: string[];
}

const checks: BranchCheck[] = [];

function fail(message: string): never {
  throw new Error(message);
}

function ensure(condition: boolean, message: string): void {
  if (!condition) fail(message);
}

function pass(id: string, detail: string): void {
  checks.push({ id, detail });
  console.log(`[PASS] ${id} | ${detail}`);
}

function unlockCityRuntime(boot: GameBootstrap, cityId: string): void {
  const city = boot.app.controller.config.getCity(cityId);
  if (!city) fail(`missing city ${cityId}`);
  const runtime: GameState["cities"][string] = {
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
  boot.app.controller.state.cities[cityId] = runtime;
  if (cityId !== "CITY-START") {
    boot.app.controller.state.gridLinks[`${cityId}::CITY-START`] = {
      linkId: `${cityId}::CITY-START`,
      fromCityId: cityId,
      toCityId: "CITY-START",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 500
    };
  }
}

function setupBoot(): GameBootstrap {
  const config = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tech" }).config;
  const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
  boot.app.controller.state.companyLevel = 5;
  boot.app.controller.state.funds = 1000;
  boot.app.controller.state.litTechIds = [
    "wind_1",
    "solar_1",
    "thermal_1",
    "hydro_1",
    "wind_3",
    "solar_4",
    "thermal_3",
    "hydro_4",
    "nuclear_1",
    "nuclear_2",
    "storage_system_1"
  ];
  for (const cityId of ["CITY-START", "CITY-MAP02-01", "CITY-MAP06-01", "CITY-MAP07-01"]) {
    unlockCityRuntime(boot, cityId);
  }
  return boot;
}

function verifyBuildCase(item: BuildCase): void {
  const boot = setupBoot();
  clientNavOpenCity(boot, item.cityId, item.regionId);
  const profile = getCityHudProfileSnapshot(boot);
  if (!profile) fail(`missing profile for ${item.cityId}`);
  for (const tag of item.expectedPressureTags) {
    ensure(profile.operatingPressureTags.includes(tag as never), `${item.id} missing pressure tag ${tag}`);
  }

  const snapshot = getCityHudBuildSelectionSnapshot(boot);
  if (item.expectedSelectedFacilityId) {
    ensure(
      snapshot.selectedFacilityId === item.expectedSelectedFacilityId,
      `${item.id} expected selected ${item.expectedSelectedFacilityId}, got ${snapshot.selectedFacilityId}`
    );
  }
  const candidate = snapshot.candidates.find((entry) => entry.facilityId === item.facilityId);
  if (!candidate) fail(`${item.id} missing ${item.facilityId} candidate`);
  ensure(candidate.tier === item.expectedTier, `${item.id} expected tier ${item.expectedTier}, got ${candidate.tier}`);
  ensure(
    candidate.resourceMultiplier === item.expectedResourceMultiplier,
    `${item.id} expected resource x${item.expectedResourceMultiplier}, got x${candidate.resourceMultiplier}`
  );
  ensure(
    candidate.storageMultiplier === item.expectedStorageMultiplier,
    `${item.id} expected storage x${item.expectedStorageMultiplier}, got x${candidate.storageMultiplier}`
  );

  const beforeQueueLength = boot.app.controller.state.constructionQueue.length;
  const out = cityHudBuildSelected(boot, item.facilityId);
  ensure(out.ok, `${item.id} build failed: ${out.errorCode ?? "unknown"}`);
  const queued = boot.app.controller.state.constructionQueue[beforeQueueLength];
  ensure(!!queued, `${item.id} did not append construction queue`);
  ensure(queued.cityId === item.cityId, `${item.id} queued city ${queued.cityId}`);
  ensure(queued.facilityId === item.facilityId, `${item.id} queued facility ${queued.facilityId}`);
  ensure(queued.tier === item.expectedTier, `${item.id} queued tier ${queued.tier}`);
  pass(
    item.id,
    `${item.cityId}:${item.facilityId}.${item.expectedTier} cost=${candidate.buildCost} output=${candidate.effectiveOutputMw}MW`
  );
}

function runCityBranchesRoute(): void {
  console.log("=== Energy Company FAST-01 city branches route ===");
  const cases: BuildCase[] = [
    {
      id: "wind-tier",
      cityId: "CITY-START",
      regionId: "MAP-01",
      facilityId: "wind",
      expectedTier: 3,
      expectedResourceMultiplier: 1,
      expectedStorageMultiplier: 2,
      expectedPressureTags: ["supply_gap"]
    },
    {
      id: "solar-rich",
      cityId: "CITY-MAP06-01",
      regionId: "MAP-06",
      facilityId: "solar",
      expectedTier: 4,
      expectedResourceMultiplier: 2,
      expectedStorageMultiplier: 2,
      expectedSelectedFacilityId: "solar",
      expectedPressureTags: ["high_demand", "fossil_transition", "nuclear_siting"]
    },
    {
      id: "thermal-fossil",
      cityId: "CITY-MAP06-01",
      regionId: "MAP-06",
      facilityId: "thermal",
      expectedTier: 3,
      expectedResourceMultiplier: 1,
      expectedStorageMultiplier: 1,
      expectedPressureTags: ["fossil_transition"]
    },
    {
      id: "hydro-river",
      cityId: "CITY-MAP07-01",
      regionId: "MAP-07",
      facilityId: "hydro",
      expectedTier: 4,
      expectedResourceMultiplier: 2,
      expectedStorageMultiplier: 2,
      expectedSelectedFacilityId: "hydro",
      expectedPressureTags: ["hydro_site_bound"]
    },
    {
      id: "nuclear-siting",
      cityId: "CITY-MAP02-01",
      regionId: "MAP-02",
      facilityId: "nuclear",
      expectedTier: 2,
      expectedResourceMultiplier: 1,
      expectedStorageMultiplier: 1,
      expectedPressureTags: ["nuclear_siting"]
    }
  ];

  for (const item of cases) {
    verifyBuildCase(item);
  }
  console.log("---");
  console.log(`City branches route summary: passed=${checks.length}`);
}

try {
  runCityBranchesRoute();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`[FAIL] city-branches-route | ${message}`);
  process.exit(1);
}
