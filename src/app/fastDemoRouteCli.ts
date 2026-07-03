#!/usr/bin/env node
/**
 * FAST-01 fixed demo route smoke.
 *
 * This is not a balance solver. It is a deterministic, player-action route that
 * proves the current demo can be driven from opening month to the terminal route:
 * level I-V, cross-region links, mid/late construction branches, super hydro,
 * MET-B connection, final disaster, and victory result.
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenRegionForRegion } from "../modules/screenRegion.js";
import { createScreenRunResult } from "../modules/screenRunResult.js";
import { createScreenWorldMap } from "../modules/screenWorldMap.js";
import type { RunController } from "../modules/runController.js";
import type { Command } from "../sim/index.js";

interface Milestone {
  id: string;
  detail: string;
}

const milestones: Milestone[] = [];
const usedLoans = new Set<string>();

function fail(message: string): never {
  throw new Error(message);
}

function ensure(condition: boolean, message: string): void {
  if (!condition) fail(message);
}

function logMilestone(id: string, detail: string): void {
  milestones.push({ id, detail });
  console.log(`[PASS] ${id} | ${detail}`);
}

function activeConstructionCount(controller: RunController): number {
  return controller.state.constructionQueue.length;
}

function activeResearchCount(controller: RunController): number {
  return Object.keys(controller.state.researches).length;
}

function commandLabel(command: Command): string {
  if (command.type === "queue_construction") {
    return `${command.type}:${command.cityId}:${command.facilityId}.${command.tier}`;
  }
  if (command.type === "queue_grid_link") {
    return `${command.type}:${command.fromCityId}->${command.toCityId}:${command.linkType}`;
  }
  if (command.type === "start_research") return `${command.type}:${command.techId}`;
  if (command.type === "apply_loan") return `${command.type}:${command.loanId}`;
  if (command.type === "queue_super_hydro") return `${command.type}:${command.slotId}`;
  return command.type;
}

function runCommand(controller: RunController, command: Command): void {
  const result = controller.runCommand(command);
  if (!result.ok) {
    fail(`${commandLabel(command)} failed: ${result.error} - ${result.message}`);
  }
}

function advanceOneMonth(controller: RunController): void {
  const result = controller.runNextMonth();
  if (!result.ok) {
    fail(`settle failed at month ${controller.state.currentMonth}: ${result.error} - ${result.message}`);
  }
}

function advanceUntil(controller: RunController, label: string, done: () => boolean, maxMonths: number): void {
  for (let i = 0; i < maxMonths; i += 1) {
    if (done()) return;
    advanceOneMonth(controller);
    ensure(controller.state.runResult === null || done(), `${label} ended run before completion`);
  }
  fail(`${label} timed out at month ${controller.state.currentMonth}`);
}

function bestUnlockedLoan(controller: RunController): string | null {
  const activeLoan = Object.keys(controller.state.loans).length > 0;
  if (activeLoan) return null;
  const rows = [...controller.config.bundle.loanTiers]
    .filter(
      (loan) => (loan.unlock_level ?? 1) <= controller.state.companyLevel && !usedLoans.has(loan.loan_id)
    )
    .sort((a, b) => (b.unlock_level ?? 1) - (a.unlock_level ?? 1));
  return rows[0]?.loan_id ?? null;
}

function ensureFunds(controller: RunController, minimum: number): void {
  let guard = 0;
  while (controller.state.funds < minimum && guard < 60) {
    const loanId = bestUnlockedLoan(controller);
    if (loanId) {
      runCommand(controller, { type: "apply_loan", loanId });
      usedLoans.add(loanId);
    } else if (controller.state.adsRemaining > 0) {
      runCommand(controller, { type: "claim_ad_reward", adType: "cash" });
    } else {
      advanceOneMonth(controller);
    }
    ensure(controller.state.runResult === null, "funding step ended run");
    guard += 1;
  }
  ensure(controller.state.funds >= minimum, `funding failed: funds=${controller.state.funds}, need=${minimum}`);
}

function finishBuildQueue(controller: RunController): void {
  advanceUntil(controller, "finish construction queue", () => activeConstructionCount(controller) === 0, 12);
}

function finishResearch(controller: RunController): void {
  advanceUntil(controller, "finish research", () => activeResearchCount(controller) === 0, 8);
}

function build(controller: RunController, cityId: string, facilityId: string, tier = 1): void {
  advanceUntil(controller, "free construction queue", () => activeConstructionCount(controller) < 3, 12);
  const spec = controller.config.getFacility(facilityId);
  if (!spec) fail(`missing facility ${facilityId}`);
  ensureFunds(controller, spec.build_cost_total + 20);
  runCommand(controller, { type: "queue_construction", cityId, facilityId, tier });
}

function buildBatch(
  controller: RunController,
  items: Array<{ cityId: string; facilityId: string; tier?: number }>
): void {
  for (const item of items) {
    build(controller, item.cityId, item.facilityId, item.tier ?? 1);
  }
  finishBuildQueue(controller);
}

function research(controller: RunController, techId: string): void {
  advanceUntil(controller, "free research queue", () => activeResearchCount(controller) === 0, 8);
  const tech = controller.config.getTechnology(techId);
  if (!tech) fail(`missing tech ${techId}`);
  ensureFunds(controller, tech.research_cost + 30);
  runCommand(controller, { type: "start_research", techId });
  finishResearch(controller);
  ensure(controller.state.litTechIds.includes(techId), `tech ${techId} should be lit`);
}

function researchWithSpeedup(controller: RunController, techId: string): void {
  advanceUntil(controller, "free research queue", () => activeResearchCount(controller) === 0, 8);
  const tech = controller.config.getTechnology(techId);
  if (!tech) fail(`missing tech ${techId}`);
  ensureFunds(controller, tech.research_cost + 30);
  ensure(controller.state.adsRemaining > 0, "speedup ad should be available for terminal tech");
  runCommand(controller, { type: "start_research", techId });
  runCommand(controller, { type: "claim_ad_reward", adType: "speedup" });
  ensure(controller.state.litTechIds.includes(techId), `tech ${techId} should be lit by speedup`);
}

function connect(controller: RunController, fromCityId: string, toCityId: string): void {
  ensureFunds(controller, 40);
  runCommand(controller, { type: "queue_grid_link", fromCityId, toCityId, linkType: "trunk" });
  advanceOneMonth(controller);
}

function connectRegion(controller: RunController, fromCityId: string, toCityId: string): void {
  ensureFunds(controller, 30);
  runCommand(controller, { type: "queue_grid_link", fromCityId, toCityId, linkType: "region" });
  advanceOneMonth(controller);
}

function ensureLevel(controller: RunController, level: number, maxMonths: number): void {
  try {
    advanceUntil(controller, `reach level ${level}`, () => controller.state.companyLevel >= level, maxMonths);
  } catch {
    fail(
      `reach level ${level} timed out: month=${controller.state.currentMonth}, level=${controller.state.companyLevel}, sv=${controller.state.socialValueCurrent}, funds=${controller.state.funds}`
    );
  }
}

function runFastDemoRoute(): void {
  const controller = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tech" });
  console.log("=== Energy Company FAST-01 fixed demo route ===");

  ensure(controller.state.companyLevel === 1, "route should start at company level I");
  logMilestone("start", `month=${controller.state.currentMonth}, funds=${controller.state.funds}`);

  ensureFunds(controller, 120);
  buildBatch(controller, [
    { cityId: "CITY-START", facilityId: "thermal" },
    { cityId: "CITY-START", facilityId: "hydro" },
    { cityId: "CITY-START", facilityId: "wind" }
  ]);
  ensureLevel(controller, 2, 12);
  logMilestone("level-II", `month=${controller.state.currentMonth}, sv=${controller.state.socialValueCurrent}`);

  connectRegion(controller, "CITY-START", "CITY-MAP01-02");
  connectRegion(controller, "CITY-START", "CITY-MAP01-03");
  buildBatch(controller, [
    { cityId: "CITY-MAP01-02", facilityId: "solar" },
    { cityId: "CITY-MAP01-03", facilityId: "wind" },
    { cityId: "CITY-START", facilityId: "thermal" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-START", facilityId: "thermal" },
    { cityId: "CITY-START", facilityId: "hydro" },
    { cityId: "CITY-MAP01-02", facilityId: "solar" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-START", facilityId: "thermal" },
    { cityId: "CITY-MAP01-02", facilityId: "thermal" },
    { cityId: "CITY-MAP01-03", facilityId: "wind" }
  ]);
  ensureLevel(controller, 3, 18);
  logMilestone("level-III", `month=${controller.state.currentMonth}, sv=${controller.state.socialValueCurrent}`);

  research(controller, "grid_regional");
  researchWithSpeedup(controller, "storage_system_1");
  connect(controller, "CITY-START", "CITY-MAP02-01");
  connect(controller, "CITY-START", "CITY-META-01");
  connectRegion(controller, "CITY-MAP02-01", "CITY-MAP02-02");
  connectRegion(controller, "CITY-MAP02-01", "CITY-MAP02-03");
  buildBatch(controller, [
    { cityId: "CITY-MAP02-01", facilityId: "thermal" },
    { cityId: "CITY-MAP02-02", facilityId: "wind" },
    { cityId: "CITY-MAP02-03", facilityId: "solar" }
  ]);
  researchWithSpeedup(controller, "nuclear_1");
  buildBatch(controller, [
    { cityId: "CITY-META-01", facilityId: "nuclear" },
    { cityId: "CITY-META-01", facilityId: "hydro" },
    { cityId: "CITY-START", facilityId: "thermal" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-START", facilityId: "nuclear" },
    { cityId: "CITY-MAP02-01", facilityId: "nuclear" },
    { cityId: "CITY-META-01", facilityId: "thermal" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP02-01", facilityId: "hydro" },
    { cityId: "CITY-MAP02-01", facilityId: "thermal" },
    { cityId: "CITY-META-01", facilityId: "solar" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP02-02", facilityId: "wind" },
    { cityId: "CITY-MAP02-03", facilityId: "wind" },
    { cityId: "CITY-META-01", facilityId: "hydro" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP02-03", facilityId: "solar" },
    { cityId: "CITY-META-01", facilityId: "solar" },
    { cityId: "CITY-START", facilityId: "hydro" }
  ]);
  ensureLevel(controller, 4, 24);
  logMilestone("level-IV", `month=${controller.state.currentMonth}, sv=${controller.state.socialValueCurrent}`);

  researchWithSpeedup(controller, "grid_backbone");
  connect(controller, "CITY-START", "CITY-MAP03-01");
  connect(controller, "CITY-START", "CITY-MAP04-01");
  connect(controller, "CITY-START", "CITY-MAP05-01");
  buildBatch(controller, [
    { cityId: "CITY-MAP03-01", facilityId: "hydro" },
    { cityId: "CITY-MAP04-01", facilityId: "solar" },
    { cityId: "CITY-MAP05-01", facilityId: "hydro" }
  ]);
  connectRegion(controller, "CITY-MAP03-01", "CITY-MAP03-02");
  connectRegion(controller, "CITY-MAP03-01", "CITY-MAP03-03");
  connectRegion(controller, "CITY-MAP04-01", "CITY-MAP04-02");
  connectRegion(controller, "CITY-MAP04-01", "CITY-MAP04-03");
  connectRegion(controller, "CITY-MAP05-01", "CITY-MAP05-02");
  connectRegion(controller, "CITY-MAP05-01", "CITY-MAP05-03");
  buildBatch(controller, [
    { cityId: "CITY-MAP03-02", facilityId: "hydro" },
    { cityId: "CITY-MAP04-03", facilityId: "wind" },
    { cityId: "CITY-MAP05-03", facilityId: "solar" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP03-03", facilityId: "wind" },
    { cityId: "CITY-MAP04-02", facilityId: "solar" },
    { cityId: "CITY-MAP05-02", facilityId: "hydro" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP03-01", facilityId: "nuclear" },
    { cityId: "CITY-MAP04-01", facilityId: "nuclear" },
    { cityId: "CITY-MAP03-02", facilityId: "solar" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP05-01", facilityId: "hydro" },
    { cityId: "CITY-MAP05-03", facilityId: "wind" },
    { cityId: "CITY-MAP04-02", facilityId: "solar" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP03-01", facilityId: "hydro" },
    { cityId: "CITY-MAP04-01", facilityId: "solar" },
    { cityId: "CITY-MAP05-02", facilityId: "hydro" }
  ]);
  buildBatch(controller, [
    { cityId: "CITY-MAP03-03", facilityId: "wind" },
    { cityId: "CITY-MAP04-03", facilityId: "wind" },
    { cityId: "CITY-MAP05-03", facilityId: "solar" }
  ]);
  ensureLevel(controller, 5, 24);
  logMilestone("level-V", `month=${controller.state.currentMonth}, sv=${controller.state.socialValueCurrent}`);

  const world = createScreenWorldMap(controller).getSnapshot();
  ensure(world.regions.find((region) => region.regionId === "MET-B")?.unlocked === true, "MET-B should be unlocked");
  connect(controller, "CITY-START", "CITY-METB-01");
  researchWithSpeedup(controller, "super_hydro");
  ensureFunds(controller, 220);
  runCommand(controller, { type: "queue_super_hydro", slotId: "super_hydro_1" });
  advanceUntil(
    controller,
    "finish super hydro",
    () => controller.state.superHydros.super_hydro_1?.status === "finished",
    8
  );
  connect(controller, "CITY-METB-01", "SUPER-HYDRO-1");

  const metB = createScreenRegionForRegion(controller, "MET-B").getSnapshot();
  ensure(metB.linkCandidates.some((item) => item.toCityId === "SUPER-HYDRO-1" || item.fromCityId === "SUPER-HYDRO-1"), "MET-B should expose super hydro route");
  logMilestone(
    "terminal-route",
    `month=${controller.state.currentMonth}, metB_gap=${metB.supplyGapMw}, superHydro=${controller.state.superHydros.super_hydro_1.status}`
  );

  advanceUntil(controller, "reach final result", () => controller.state.runResult !== null, 90);
  const result = createScreenRunResult(controller).getSnapshot();
  if (result === null) fail("run result snapshot should exist");
  ensure(result.runResult === "victory", `expected victory, got ${result.runResult}`);
  ensure(controller.state.disastersTriggered.includes(4), "final disaster should be triggered");
  logMilestone("victory", `month=${result.month}, finalDisaster=${result.finalDisasterTriggered}`);

  console.log("---");
  console.log(`FAST-01 route summary: passed=${milestones.length}, result=${result.runResult}`);
}

try {
  runFastDemoRoute();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`[FAIL] fast-demo-route | ${message}`);
  process.exit(1);
}
