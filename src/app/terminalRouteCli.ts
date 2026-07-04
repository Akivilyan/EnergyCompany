#!/usr/bin/env node
/**
 * FAST-01 terminal route smoke.
 *
 * Verifies the end-game route as its own focused player-facing path:
 * MET-B target, super hydro build, super hydro grid connection, final disaster,
 * victory result, and command blocking after run_result.
 */
import { createScreenRunResult } from "../modules/screenRunResult.js";
import type { RunController } from "../modules/runController.js";
import { createGameBootstrapFromRepo } from "./gameBootstrap.node.js";
import { clientNavOpenWorldMap } from "./screenNavController.js";
import {
  getWorldHudSelectionSnapshot,
  worldOpenSelectedTarget,
  worldQueueSelectedTrunk,
  worldQueueSuperHydro,
  worldQueueSuperHydroGridLink
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

function selectedWorldCandidate(boot: GameBootstrap) {
  const snapshot = getWorldHudSelectionSnapshot(boot);
  return snapshot.candidates.find((item) => item.candidateId === snapshot.selectedCandidateId) ?? null;
}

function advanceOneMonth(boot: GameBootstrap): void {
  const out = boot.app.controller.runNextMonth();
  if (!out.ok) fail(`advance failed: ${out.error} - ${out.message}`);
}

function advanceUntil(
  boot: GameBootstrap,
  label: string,
  done: () => boolean,
  maxMonths: number
): void {
  for (let i = 0; i < maxMonths; i += 1) {
    if (done()) return;
    advanceOneMonth(boot);
    ensure(boot.app.controller.state.runResult === null || done(), `${label} ended run early`);
  }
  fail(`${label} timed out at month ${boot.app.controller.state.currentMonth}`);
}

function createTerminalBoot(): GameBootstrap {
  const boot = createGameBootstrapFromRepo();
  boot.app.controller.state.companyLevel = 5;
  boot.app.controller.state.funds = 500;
  boot.app.controller.state.litTechIds.push("super_hydro");
  return boot;
}

function checkMetBTargetAndTrunk(boot: GameBootstrap): void {
  clientNavOpenWorldMap(boot);
  const selected = selectedWorldCandidate(boot);
  if (!selected) fail("expected selected world target");
  ensure(selected.regionId === "MET-B", `expected MET-B target, got ${selected.regionId}`);
  ensure(selected.targetType === "city", `expected MET-B city target, got ${selected.targetType}`);
  ensure(selected.operatingPressureTags.includes("terminal_load"), "MET-B should expose terminal load pressure");

  const open = worldOpenSelectedTarget(boot);
  ensure(open.ok, `open MET-B failed: ${open.errorCode ?? "unknown"}`);
  ensure(boot.play.getNavigation().currentScreen === "screen_city_detail", "MET-B should open city detail");
  ensure(boot.play.getNavigation().cityId === "CITY-METB-01", "MET-B central city should open");

  clientNavOpenWorldMap(boot);
  const trunk = worldQueueSelectedTrunk(boot);
  ensure(trunk.ok, `MET-B trunk failed: ${trunk.errorCode ?? "unknown"}`);
  advanceOneMonth(boot);
  ensure(
    boot.app.controller.state.gridLinks["CITY-METB-01::CITY-START"]?.status === "finished",
    "MET-B trunk should finish"
  );
  pass("metb-target-trunk", "MET-B opened and trunk connected");
}

function checkSuperHydroBuildAndGrid(boot: GameBootstrap): void {
  clientNavOpenWorldMap(boot);
  for (const slotId of ["super_hydro_1", "super_hydro_2"]) {
    const queued = worldQueueSuperHydro(boot);
    ensure(queued.ok, `${slotId} queue failed: ${queued.errorCode ?? "unknown"}`);
    advanceUntil(
      boot,
      `finish ${slotId}`,
      () => boot.app.controller.state.superHydros[slotId]?.status === "finished",
      8
    );

    const grid = worldQueueSuperHydroGridLink(boot);
    ensure(grid.ok, `${slotId} grid failed: ${grid.errorCode ?? "unknown"}`);
    advanceOneMonth(boot);
  }

  const metB = boot.app.controller.state.cities["CITY-METB-01"];
  ensure(!!metB, "MET-B city should be operable after trunk connection");
  ensure(metB.effectiveSupplyMw >= metB.demandMw, `MET-B supply gap remains ${metB.demandMw - metB.effectiveSupplyMw}`);
  pass(
    "super-hydro-grid",
    `supply=${metB.effectiveSupplyMw}/${metB.demandMw}, slots=${Object.keys(boot.app.controller.state.superHydros).length}`
  );
}

function checkFinalDisasterVictory(controller: RunController): void {
  const targetMonth = controller.config.bundle.runConfig.campaign_run_target_months;
  controller.state.currentMonth = targetMonth;
  const settle = controller.runNextMonth();
  if (!settle.ok) fail(`final settle failed: ${settle.error} - ${settle.message}`);

  const result = createScreenRunResult(controller).getSnapshot();
  if (!result) fail("run result snapshot should exist");
  ensure(result.runResult === "victory", `expected victory, got ${result.runResult}`);
  ensure(result.finalDisasterTriggered, "final disaster should be triggered");
  ensure(result.terminalRoute.metBConnected, "result should mark MET-B connected");
  ensure(result.terminalRoute.superHydroConnectedOutputMw > 0, "result should include connected super hydro output");
  ensure(result.terminalRoute.metBSupplyGapMw === 0, `result MET-B gap should be 0, got ${result.terminalRoute.metBSupplyGapMw}`);

  const blocked = controller.runCommand({ type: "claim_ad_reward", adType: "cash" });
  ensure(!blocked.ok, "playable command should be blocked after run_result");
  pass(
    "final-victory-result",
    `month=${result.month}, hydro=${result.terminalRoute.superHydroConnectedOutputMw}/${result.terminalRoute.superHydroTotalOutputMw}`
  );
}

function runTerminalRoute(): void {
  console.log("=== Energy Company FAST-01 terminal route ===");
  const boot = createTerminalBoot();
  checkMetBTargetAndTrunk(boot);
  checkSuperHydroBuildAndGrid(boot);
  checkFinalDisasterVictory(boot.app.controller);
  console.log("---");
  console.log(`Terminal route summary: passed=${checks.length}`);
}

try {
  runTerminalRoute();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`[FAIL] terminal-route | ${message}`);
  process.exit(1);
}
