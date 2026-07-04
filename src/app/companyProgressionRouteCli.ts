#!/usr/bin/env node
/**
 * FAST-01 company progression route smoke.
 *
 * Verifies that company level I-V progression is not just a numeric threshold:
 * each tier unlocks finance, tech, and map expansion surfaces while the route is
 * driven by real construction, research, loan/ad funding, and settlement.
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenCompany } from "../modules/screenCompany.js";
import { createScreenRegionForRegion } from "../modules/screenRegion.js";
import { createScreenTechTree } from "../modules/screenTechTree.js";
import { createScreenWorldMap } from "../modules/screenWorldMap.js";
import type { RunController } from "../modules/runController.js";
import type { Command } from "../sim/index.js";

interface Check {
  id: string;
  detail: string;
}

const checks: Check[] = [];
const usedLoans = new Set<string>();
let adFundingUsed = false;
let loanFundingUsed = false;

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

function activeConstructionCount(controller: RunController): number {
  return controller.state.constructionQueue.length;
}

function activeResearchCount(controller: RunController): number {
  return Object.keys(controller.state.researches).length;
}

function commandLabel(command: Command): string {
  if (command.type === "queue_construction") return `${command.cityId}:${command.facilityId}.${command.tier}`;
  if (command.type === "queue_grid_link") return `${command.fromCityId}->${command.toCityId}:${command.linkType}`;
  if (command.type === "start_research") return `research:${command.techId}`;
  if (command.type === "apply_loan") return `loan:${command.loanId}`;
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
  if (!result.ok) fail(`settle failed: ${result.error} - ${result.message}`);
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
  if (Object.keys(controller.state.loans).length > 0) return null;
  return [...controller.config.bundle.loanTiers]
    .filter((loan) => (loan.unlock_level ?? 1) <= controller.state.companyLevel && !usedLoans.has(loan.loan_id))
    .sort((a, b) => (b.unlock_level ?? 1) - (a.unlock_level ?? 1))[0]?.loan_id ?? null;
}

function ensureFunds(controller: RunController, minimum: number): void {
  let guard = 0;
  while (controller.state.funds < minimum && guard < 72) {
    const loanId = bestUnlockedLoan(controller);
    if (loanId) {
      runCommand(controller, { type: "apply_loan", loanId });
      usedLoans.add(loanId);
      loanFundingUsed = true;
    } else if (controller.state.adsRemaining > 0) {
      runCommand(controller, { type: "claim_ad_reward", adType: "cash" });
      adFundingUsed = true;
    } else {
      advanceOneMonth(controller);
    }
    ensure(controller.state.runResult === null, "funding step ended run");
    guard += 1;
  }
  ensure(controller.state.funds >= minimum, `funding failed: funds=${controller.state.funds}, need=${minimum}`);
}

function finishBuildQueue(controller: RunController): void {
  advanceUntil(controller, "finish construction queue", () => activeConstructionCount(controller) === 0, 14);
}

function finishResearch(controller: RunController): void {
  advanceUntil(controller, "finish research", () => activeResearchCount(controller) === 0, 8);
}

function build(controller: RunController, cityId: string, facilityId: string, tier = 1): void {
  advanceUntil(controller, "free construction queue", () => activeConstructionCount(controller) < 3, 14);
  const spec = controller.config.getFacility(facilityId);
  if (!spec) fail(`missing facility ${facilityId}`);
  ensureFunds(controller, spec.build_cost_total * tier + 20);
  runCommand(controller, { type: "queue_construction", cityId, facilityId, tier });
}

function buildBatch(
  controller: RunController,
  items: Array<{ cityId: string; facilityId: string; tier?: number }>
): void {
  for (const item of items) build(controller, item.cityId, item.facilityId, item.tier ?? 1);
  finishBuildQueue(controller);
}

function researchWithSpeedup(controller: RunController, techId: string): void {
  advanceUntil(controller, "free research queue", () => activeResearchCount(controller) === 0, 8);
  const tech = controller.config.getTechnology(techId);
  if (!tech) fail(`missing tech ${techId}`);
  ensureFunds(controller, tech.research_cost + 30);
  runCommand(controller, { type: "start_research", techId });
  if (controller.state.adsRemaining > 0) {
    runCommand(controller, { type: "claim_ad_reward", adType: "speedup" });
  }
  finishResearch(controller);
  ensure(controller.state.litTechIds.includes(techId), `tech ${techId} should be lit`);
}

function connect(controller: RunController, fromCityId: string, toCityId: string, linkType: "region" | "trunk"): void {
  ensureFunds(controller, linkType === "trunk" ? 40 : 30);
  runCommand(controller, { type: "queue_grid_link", fromCityId, toCityId, linkType });
  advanceOneMonth(controller);
}

function ensureLevel(controller: RunController, level: number, maxMonths: number): void {
  advanceUntil(controller, `reach level ${level}`, () => controller.state.companyLevel >= level, maxMonths);
}

function assertCompanyTier(
  controller: RunController,
  input: {
    level: number;
    loanId: string;
    canOpenTech: boolean;
    minUnlockedRegions: number;
    researchable?: string[];
    unlockedRegions?: string[];
    nextUnlockLevel?: number;
  }
): void {
  const company = createScreenCompany(controller).getSnapshot();
  const tech = createScreenTechTree(controller).getSnapshot();
  const world = createScreenWorldMap(controller).getSnapshot();
  ensure(company.companyLevel >= input.level, `expected company level ${input.level}, got ${company.companyLevel}`);
  ensure(
    company.loanTierOptions.find((loan) => loan.loanId === input.loanId)?.unlocked === true,
    `expected ${input.loanId} unlocked at level ${input.level}`
  );
  ensure(tech.canOpen === input.canOpenTech, `expected tech canOpen=${input.canOpenTech} at level ${input.level}`);
  for (const techId of input.researchable ?? []) {
    ensure(tech.researchableTechIds.includes(techId), `expected researchable ${techId} at level ${input.level}`);
  }
  ensure(
    world.unlockedRegions >= input.minUnlockedRegions,
    `expected >=${input.minUnlockedRegions} unlocked regions, got ${world.unlockedRegions}`
  );
  for (const regionId of input.unlockedRegions ?? []) {
    ensure(
      world.regions.find((region) => region.regionId === regionId)?.unlocked === true,
      `expected ${regionId} unlocked at level ${input.level}`
    );
  }
  if (input.nextUnlockLevel !== undefined) {
    ensure(
      world.nextUnlockRegion?.unlockCompanyLevel === input.nextUnlockLevel,
      `expected next unlock level ${input.nextUnlockLevel}, got ${world.nextUnlockRegion?.unlockCompanyLevel ?? "none"}`
    );
  }
  pass(
    `level-${input.level}`,
    `month=${controller.state.currentMonth}, sv=${controller.state.socialValueCurrent}, loan=${input.loanId}, regions=${world.unlockedRegions}`
  );
}

function runCompanyProgressionRoute(): void {
  const controller = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tech" });
  console.log("=== Energy Company FAST-01 company progression route ===");

  assertCompanyTier(controller, {
    level: 1,
    loanId: "loan_1",
    canOpenTech: false,
    minUnlockedRegions: 1,
    unlockedRegions: ["MAP-01"],
    nextUnlockLevel: 3
  });
  controller.state.funds = 20;

  buildBatch(controller, [
    { cityId: "CITY-START", facilityId: "thermal" },
    { cityId: "CITY-START", facilityId: "hydro" },
    { cityId: "CITY-START", facilityId: "wind" }
  ]);
  ensureLevel(controller, 2, 12);
  assertCompanyTier(controller, {
    level: 2,
    loanId: "loan_2",
    canOpenTech: true,
    minUnlockedRegions: 1,
    researchable: ["wind_2", "solar_2", "thermal_2", "hydro_2"],
    nextUnlockLevel: 3
  });

  connect(controller, "CITY-START", "CITY-MAP01-02", "region");
  connect(controller, "CITY-START", "CITY-MAP01-03", "region");
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
  assertCompanyTier(controller, {
    level: 3,
    loanId: "loan_3",
    canOpenTech: true,
    minUnlockedRegions: 3,
    researchable: ["grid_regional", "storage_system_1"],
    unlockedRegions: ["MAP-02", "MET-A"],
    nextUnlockLevel: 4
  });

  researchWithSpeedup(controller, "grid_regional");
  researchWithSpeedup(controller, "storage_system_1");
  connect(controller, "CITY-START", "CITY-MAP02-01", "trunk");
  connect(controller, "CITY-START", "CITY-META-01", "trunk");
  connect(controller, "CITY-MAP02-01", "CITY-MAP02-02", "region");
  connect(controller, "CITY-MAP02-01", "CITY-MAP02-03", "region");
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
  assertCompanyTier(controller, {
    level: 4,
    loanId: "loan_4",
    canOpenTech: true,
    minUnlockedRegions: 6,
    researchable: ["grid_backbone", "eng_cashflow", "eng_risk_reserve"],
    unlockedRegions: ["MAP-03", "MAP-04", "MAP-05"],
    nextUnlockLevel: 5
  });

  researchWithSpeedup(controller, "grid_backbone");
  connect(controller, "CITY-START", "CITY-MAP03-01", "trunk");
  connect(controller, "CITY-START", "CITY-MAP04-01", "trunk");
  connect(controller, "CITY-START", "CITY-MAP05-01", "trunk");
  buildBatch(controller, [
    { cityId: "CITY-MAP03-01", facilityId: "hydro" },
    { cityId: "CITY-MAP04-01", facilityId: "solar" },
    { cityId: "CITY-MAP05-01", facilityId: "hydro" }
  ]);
  connect(controller, "CITY-MAP03-01", "CITY-MAP03-02", "region");
  connect(controller, "CITY-MAP03-01", "CITY-MAP03-03", "region");
  connect(controller, "CITY-MAP04-01", "CITY-MAP04-02", "region");
  connect(controller, "CITY-MAP04-01", "CITY-MAP04-03", "region");
  connect(controller, "CITY-MAP05-01", "CITY-MAP05-02", "region");
  connect(controller, "CITY-MAP05-01", "CITY-MAP05-03", "region");
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
  assertCompanyTier(controller, {
    level: 5,
    loanId: "loan_5",
    canOpenTech: true,
    minUnlockedRegions: 10,
    researchable: ["super_hydro", "uhv_transmission", "eng_green_pr"],
    unlockedRegions: ["MAP-06", "MAP-07", "MAP-08", "MET-B"]
  });

  const metB = createScreenRegionForRegion(controller, "MET-B").getSnapshot();
  ensure(metB.operatingPressureTags.includes("terminal_load"), "MET-B should expose terminal load pressure");
  ensure(adFundingUsed || loanFundingUsed, "route should use funding pressure relief");
  pass("funding-pressure", `ads=${adFundingUsed}, loans=${loanFundingUsed}, funds=${controller.state.funds}`);

  console.log("---");
  console.log(`Company progression route summary: passed=${checks.length}`);
}

try {
  runCompanyProgressionRoute();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`[FAIL] company-progression-route | ${message}`);
  process.exit(1);
}
