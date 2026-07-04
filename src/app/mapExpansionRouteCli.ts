#!/usr/bin/env node
/**
 * FAST-01 map expansion route smoke.
 *
 * Verifies continuous world/region expansion through player-facing HUD actions:
 * early province links, mid-game trunk expansion, late-map target rollover, and
 * local in-region links after a trunk is connected.
 */
import { cityHudAdvanceMonth } from "./cityHudController.js";
import { createGameBootstrapFromRepo } from "./gameBootstrap.node.js";
import {
  clientNavOpenRegion,
  clientNavOpenRegionById,
  clientNavOpenWorldMap
} from "./screenNavController.js";
import {
  getRegionHudSelectionSnapshot,
  regionQueueDefaultLink
} from "./regionHudController.js";
import {
  getWorldHudSelectionSnapshot,
  worldCycleTargetCandidate,
  worldOpenSelectedTarget,
  worldQueueSelectedTrunk
} from "./worldHudController.js";
import type { GameBootstrap } from "./gameBootstrap.js";

interface Check {
  id: string;
  detail: string;
}

const checks: Check[] = [];

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

function createBoot(companyLevel: number): GameBootstrap {
  const boot = createGameBootstrapFromRepo();
  boot.app.controller.state.companyLevel = companyLevel;
  boot.app.controller.state.funds = 2000;
  return boot;
}

function advanceOneMonth(boot: GameBootstrap): void {
  const out = cityHudAdvanceMonth(boot);
  if (!out.ok) fail(`advance failed: ${out.errorCode ?? "unknown"}`);
}

function selectedWorldRegion(boot: GameBootstrap): string | null {
  const snapshot = getWorldHudSelectionSnapshot(boot);
  return snapshot.candidates.find((item) => item.candidateId === snapshot.selectedCandidateId)?.regionId ?? null;
}

function cycleWorldToRegion(boot: GameBootstrap, regionId: string): void {
  for (let i = 0; i < 20; i += 1) {
    if (selectedWorldRegion(boot) === regionId) return;
    const out = worldCycleTargetCandidate(boot);
    ensure(out.ok, `cycle world target failed: ${out.errorCode ?? "unknown"}`);
  }
  fail(`world target ${regionId} not reachable`);
}

function selectedRegionLink(boot: GameBootstrap) {
  const snapshot = getRegionHudSelectionSnapshot(boot);
  return snapshot.candidates.find((item) => item.candidateId === snapshot.selectedCandidateId) ?? null;
}

function checkEarlyProvinceLinks(): void {
  const boot = createBoot(2);
  clientNavOpenRegion(boot);
  const first = regionQueueDefaultLink(boot);
  ensure(first.ok, `MAP-01 first local link failed: ${first.errorCode ?? "unknown"}`);
  advanceOneMonth(boot);

  const selection = getRegionHudSelectionSnapshot(boot);
  const second = selectedRegionLink(boot);
  if (!second) fail("expected second MAP-01 local link candidate");
  ensure(second.linkType === "region", `expected local region link, got ${second.linkType}`);
  ensure(
    second.fromCityId === "CITY-START" || second.toCityId === "CITY-START",
    `expected MAP-01 local link from start, got ${second.fromCityId}->${second.toCityId}`
  );
  const queuedSecond = regionQueueDefaultLink(boot);
  ensure(queuedSecond.ok, `MAP-01 second local link failed: ${queuedSecond.errorCode ?? "unknown"}`);
  pass("early-province-links", `candidates=${selection.candidates.length}`);
}

function checkMidgameWorldToRegionFlow(): void {
  const boot = createBoot(3);
  clientNavOpenWorldMap(boot);
  cycleWorldToRegion(boot, "MAP-02");

  const open = worldOpenSelectedTarget(boot);
  ensure(open.ok, `open MAP-02 failed: ${open.errorCode ?? "unknown"}`);
  ensure(boot.play.getNavigation().currentScreen === "screen_region", "MAP-02 should open region screen");
  ensure(boot.play.getNavigation().regionId === "MAP-02", `expected MAP-02 nav, got ${boot.play.getNavigation().regionId}`);

  const trunk = regionQueueDefaultLink(boot);
  ensure(trunk.ok, `MAP-02 trunk failed: ${trunk.errorCode ?? "unknown"}`);
  advanceOneMonth(boot);

  const local = selectedRegionLink(boot);
  if (!local) fail("expected MAP-02 local link after trunk");
  ensure(local.linkType === "region", `expected MAP-02 local region link, got ${local.linkType}`);
  const queuedLocal = regionQueueDefaultLink(boot);
  ensure(queuedLocal.ok, `MAP-02 local link failed: ${queuedLocal.errorCode ?? "unknown"}`);
  pass("midgame-world-region-flow", `${local.fromCityId}->${local.toCityId}`);
}

function checkLateMapTargetRollover(): void {
  const boot = createBoot(5);
  clientNavOpenWorldMap(boot);

  ensure(selectedWorldRegion(boot) === "MET-B", `expected MET-B default, got ${selectedWorldRegion(boot) ?? "none"}`);
  const metB = worldQueueSelectedTrunk(boot);
  ensure(metB.ok, `MET-B trunk failed: ${metB.errorCode ?? "unknown"}`);
  advanceOneMonth(boot);

  ensure(selectedWorldRegion(boot) === "MAP-06", `expected rollover to MAP-06, got ${selectedWorldRegion(boot) ?? "none"}`);
  const map06 = worldQueueSelectedTrunk(boot);
  ensure(map06.ok, `MAP-06 trunk failed: ${map06.errorCode ?? "unknown"}`);
  advanceOneMonth(boot);

  clientNavOpenRegionById(boot, "MAP-06");
  const local = selectedRegionLink(boot);
  if (!local) fail("expected MAP-06 local candidate");
  ensure(local.linkType === "region", `expected MAP-06 local link, got ${local.linkType}`);
  const queuedLocal = regionQueueDefaultLink(boot);
  ensure(queuedLocal.ok, `MAP-06 local link failed: ${queuedLocal.errorCode ?? "unknown"}`);
  pass("late-map-rollover", `MET-B->MAP-06->${local.toCityId}`);
}

function checkLateMapManualTargets(): void {
  const boot = createBoot(5);
  clientNavOpenWorldMap(boot);
  for (const regionId of ["MAP-07", "MAP-08"]) {
    cycleWorldToRegion(boot, regionId);
    const selected = getWorldHudSelectionSnapshot(boot).candidates.find(
      (item) => item.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
    );
    if (!selected) fail(`${regionId} should be selected`);
    ensure(selected.unlocked, `${regionId} should be unlocked`);
    ensure(selected.connectionStatus === "available", `${regionId} should be available`);
    ensure(selected.operatingPressureTags.length > 0, `${regionId} should expose pressure tags`);
  }
  pass("late-map-manual-targets", "MAP-07/MAP-08 available");
}

function runMapExpansionRoute(): void {
  console.log("=== Energy Company FAST-01 map expansion route ===");
  checkEarlyProvinceLinks();
  checkMidgameWorldToRegionFlow();
  checkLateMapTargetRollover();
  checkLateMapManualTargets();
  console.log("---");
  console.log(`Map expansion route summary: passed=${checks.length}`);
}

try {
  runMapExpansionRoute();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`[FAIL] map-expansion-route | ${message}`);
  process.exit(1);
}
