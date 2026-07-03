#!/usr/bin/env node
/**
 * v0 E1-E6 全链路回归 CLI。
 * 覆盖教学、城市、科技/广告、区域、灾害、终局六个体验点，
 * 输出通过率与失败案例，便于 T45-16 收口验收。
 *
 * 用法：
 *   npm run sim:regression
 */
import { createScreenCityDetail } from "../modules/screenCityDetail.js";
import { createScreenCompany } from "../modules/screenCompany.js";
import { createScreenEventsPanel } from "../modules/screenEventsPanel.js";
import { createScreenOnboarding } from "../modules/screenOnboarding.js";
import { createScreenRegion } from "../modules/screenRegion.js";
import { createScreenRunResult } from "../modules/screenRunResult.js";
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenTechTree } from "../modules/screenTechTree.js";

type ExperienceId = "E1" | "E2" | "E3" | "E4" | "E5" | "E6";

interface ScenarioResult {
  id: ExperienceId;
  title: string;
  ok: boolean;
  detail: string;
}

interface ScenarioDef {
  id: ExperienceId;
  title: string;
  run: () => ScenarioResult;
}

function fail(message: string): never {
  throw new Error(message);
}

function ensure(condition: boolean, message: string): void {
  if (!condition) fail(message);
}

function runE1(): ScenarioResult {
  const tutorialController = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tutorial" });
  const onboarding = createScreenOnboarding(tutorialController);

  const start = onboarding.getSnapshot();
  ensure(start.isTutorialRun, "tutorial run should be enabled");
  ensure(start.playableSubPhase === "blocked", "tutorial should start in blocked sub-phase");

  for (let i = 0; i < 7; i += 1) {
    const out = onboarding.advanceStep();
    ensure(out.result.ok, `advance onboarding failed at step ${out.before.currentStepId}`);
  }

  const done = onboarding.getSnapshot();
  ensure(done.currentStepId === "onb_done", "tutorial should reach onb_done");
  ensure(done.cleared, "tutorial should be marked as cleared");
  ensure(done.playableSubPhase === "navigating", "tutorial done should unlock navigating");

  const skipController = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tutorial" });
  const skipScreen = createScreenOnboarding(skipController);
  const skip = skipScreen.skipAll();
  ensure(skip.result.ok, "skip onboarding should succeed");
  const skipped = skipScreen.getSnapshot();
  ensure(skipped.skipped, "skip flag should be true");
  ensure(skipped.currentStepId === "onb_done", "skip should jump to onb_done");
  ensure(skipped.playableSubPhase === "navigating", "skip should unlock navigating");

  const normalController = createControllerFromRepoRoot();
  ensure(normalController.state.doctrineId === "tech", "normal run doctrine should be tech");
  ensure(normalController.state.difficultyId === "simple", "normal run difficulty should be simple");
  ensure(!normalController.state.isTutorialRun, "normal run should not be tutorial");

  return {
    id: "E1",
    title: "教学局完成/跳过 + tech/simple 正式局",
    ok: true,
    detail: `tutorial_step=${done.currentStepId}, skip_step=${skipped.currentStepId}, normal_doctrine=${normalController.state.doctrineId}`
  };
}

function runE2(): ScenarioResult {
  const controller = createControllerFromRepoRoot();
  const screen = createScreenCityDetail(controller, "CITY-START");
  const before = screen.getSnapshot();
  if (before === null) {
    fail("CITY-START snapshot missing");
  }

  const build = screen.queueConstruction("wind", 1);
  if (!build.ok) {
    fail("queue construction output missing");
  }
  const buildValue = build.value;
  ensure(buildValue.result.ok, "queue construction command failed");

  const advance = screen.advanceMonths(3);
  ensure(!advance.failed, "settle failed during city loop");
  ensure(advance.reports.length > 0, "city loop should produce settlement reports");
  const last = advance.reports[advance.reports.length - 1];
  ensure(last.monthTo > last.monthFrom, "month should advance");
  const hasSupplyOrSvChange = advance.reports.some(
    (report) => report.delta.effectiveSupplyMw !== 0 || report.delta.socialValue !== 0
  );
  ensure(hasSupplyOrSvChange, "expected supply or social value change in city loop");

  return {
    id: "E2",
    title: "单城建设/推月/供能与SV变化",
    ok: true,
    detail: `month=${before.month}->${last.monthTo}, supply_delta=${last.delta.effectiveSupplyMw}, sv_delta=${last.delta.socialValue}`
  };
}

function promoteToLevel2(): ReturnType<typeof createControllerFromRepoRoot> {
  const controller = createControllerFromRepoRoot();
  for (let i = 0; i < 2; i += 1) {
    const build = controller.runCommand({
      type: "queue_construction",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1
    });
    ensure(build.ok, `prebuild failed with ${build.ok ? "ok" : build.error}`);
  }
  for (let i = 0; i < 12 && controller.state.companyLevel < 2; i += 1) {
    const settle = controller.runNextMonth();
    ensure(settle.ok, `pre-level settle failed with ${settle.ok ? "ok" : settle.error}`);
  }
  ensure(controller.state.companyLevel >= 2, "expected company level II");
  return controller;
}

function runE3(): ScenarioResult {
  const controller = promoteToLevel2();
  const company = createScreenCompany(controller);
  const tech = createScreenTechTree(controller);
  const targetTechId = "wind_2";

  const start = tech.startResearch(targetTechId);
  ensure(start.result.ok, "start research failed");
  ensure(start.after.activeResearch !== null, "active research should exist");
  ensure(controller.state.adsRemaining >= 2, "adsRemaining should be >= 2 for cash+speedup");

  const adsBeforeCash = controller.state.adsRemaining;
  const cash = company.claimCashByAd();
  ensure(cash.result.ok, "cash ad reward failed");
  ensure(cash.after.funds > cash.before.funds, "cash ad should increase funds");
  ensure(cash.after.adsRemaining === adsBeforeCash - 1, "cash ad should consume one ad");

  const speedup = tech.speedupResearchByAd();
  ensure(speedup.result.ok, "speedup ad reward failed");
  ensure(speedup.after.activeResearch === null, "speedup should clear active research");
  ensure(speedup.after.litTechIds.includes(targetTechId), "speedup should light target tech");

  return {
    id: "E3",
    title: "II级科技树单队列 + 广告cash/speedup",
    ok: true,
    detail: `level=${controller.state.companyLevel}, lit=${targetTechId}, ads_left=${controller.state.adsRemaining}`
  };
}

function runE4(): ScenarioResult {
  const controller = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tech" });
  const screen = createScreenRegion(controller);
  const fromCityId = "CITY-START";
  const toCityId = "CITY-MAP01-02";

  const blocked = screen.queueGridLink(fromCityId, toCityId, "region");
  if (blocked.result.ok) {
    fail("level I queue should be blocked");
  }
  const blockedError = blocked.result.error;
  ensure(blockedError === "not_unlocked", "level I queue should fail with not_unlocked");

  for (let i = 0; i < 2; i += 1) {
    const build = controller.runCommand({
      type: "queue_construction",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1
    });
    ensure(build.ok, "level-up prebuild failed");
  }
  for (let i = 0; i < 12 && controller.state.companyLevel < 2; i += 1) {
    const month = screen.advanceOneMonth();
    ensure(month.ok, "level-up settle failed");
  }
  ensure(controller.state.companyLevel >= 2, "expected level II before queue link");

  const queued = screen.queueGridLink(fromCityId, toCityId, "region");
  ensure(queued.result.ok, "level II queue link failed");
  const settleOne = screen.advanceOneMonth();
  ensure(settleOne.ok, "settle after queue link failed");

  const snapshot = screen.getSnapshot();
  const link = snapshot.gridLinks.find(
    (item) =>
      (item.fromCityId === fromCityId && item.toCityId === toCityId) ||
      (item.fromCityId === toCityId && item.toCityId === fromCityId)
  );
  if (!link) {
    fail("queued grid link not found in snapshot");
  }
  ensure(link.status === "finished", "grid link should be finished after one month");

  return {
    id: "E4",
    title: "MAP-01 区域解锁与铺线",
    ok: true,
    detail: `level=${snapshot.companyLevel}, link=${link.linkId}, status=${link.status}`
  };
}

function runE5(): ScenarioResult {
  const controller = createControllerFromRepoRoot();
  controller.state.funds = 10000;
  const panel = createScreenEventsPanel(controller);

  while (controller.state.currentMonth < 23 && controller.state.runResult === null) {
    const month = controller.runNextMonth();
    ensure(month.ok, "settle failed before first disaster");
  }

  const snapshot = panel.getSnapshot();
  ensure(snapshot.active.length > 0, "expected at least one active disaster at M23");
  ensure(snapshot.pendingFullscreen !== null, "expected pending fullscreen modal");
  const modal = panel.getPendingFullscreenModal();
  if (!modal) {
    fail("expected pending modal copy");
  }
  const ack = panel.acknowledgeNextPending();
  ensure(ack.ok, "acknowledge pending modal failed");

  return {
    id: "E5",
    title: "固定灾害首场 + 事件面板确认",
    ok: true,
    detail: `month=${snapshot.month}, active=${snapshot.active.length}, modal_seq=${modal.entry.seq}`
  };
}

function runE6(): ScenarioResult {
  const victoryController = createControllerFromRepoRoot();
  const finalDisaster = victoryController.config.bundle.disasters.find((item) => item.is_final);
  if (!finalDisaster) {
    fail("missing final disaster config");
  }
  victoryController.state.currentMonth =
    victoryController.config.bundle.runConfig.campaign_run_target_months;
  victoryController.state.disastersTriggered.push(finalDisaster.seq);
  victoryController.state.funds = 20;
  victoryController.state.cities["CITY-START"].demandMw = 0;
  const victorySettle = victoryController.runNextMonth();
  ensure(victorySettle.ok, "victory branch settle failed");
  const victoryScreen = createScreenRunResult(victoryController);
  const victorySnapshot = victoryScreen.getSnapshot();
  if (victorySnapshot === null) {
    fail("victory run result snapshot missing");
  }
  const victory = victorySnapshot;
  ensure(victory.runResult === "victory", "victory branch should end with victory");
  const blocked = victoryController.runCommand({ type: "claim_ad_reward", adType: "cash" });
  ensure(!blocked.ok, "run_result state should block playable command");

  const bankruptController = createControllerFromRepoRoot();
  bankruptController.state.funds = -100;
  bankruptController.state.bankruptConsecutiveMonths =
    bankruptController.config.bundle.runConfig.bankrupt_consecutive_months - 1;
  bankruptController.state.cities["CITY-START"].demandMw = 0;
  const bankruptSettle = bankruptController.runNextMonth();
  ensure(bankruptSettle.ok, "bankrupt branch settle failed");
  const bankruptScreen = createScreenRunResult(bankruptController);
  const bankruptSnapshot = bankruptScreen.getSnapshot();
  if (bankruptSnapshot === null) {
    fail("bankrupt run result snapshot missing");
  }
  const bankrupt = bankruptSnapshot;
  ensure(bankrupt.runResult === "bankrupt", "bankrupt branch should end with bankrupt");

  return {
    id: "E6",
    title: "破产/通关双终局进入 run_result",
    ok: true,
    detail: `victory_month=${victory.month}, bankrupt_month=${bankrupt.month}`
  };
}

const scenarios: ScenarioDef[] = [
  { id: "E1", title: "教学局完成/跳过 + tech/simple 正式局", run: runE1 },
  { id: "E2", title: "单城建设/推月/供能与SV变化", run: runE2 },
  { id: "E3", title: "II级科技树单队列 + 广告cash/speedup", run: runE3 },
  { id: "E4", title: "MAP-01 区域解锁与铺线", run: runE4 },
  { id: "E5", title: "固定灾害首场 + 事件面板确认", run: runE5 },
  { id: "E6", title: "破产/通关双终局进入 run_result", run: runE6 }
];
const results: ScenarioResult[] = [];

console.log("=== Energy Company E1-E6 regression ===");
for (const scenario of scenarios) {
  try {
    const result = scenario.run();
    results.push(result);
    console.log(`[PASS] ${result.id} ${result.title} | ${result.detail}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedResult: ScenarioResult = {
      id: scenario.id,
      title: scenario.title,
      ok: false,
      detail: message
    };
    results.push(failedResult);
    console.log(`[FAIL] ${scenario.id} ${scenario.title} | ${failedResult.detail}`);
  }
}

const passed = results.filter((item) => item.ok).length;
const total = results.length;
const failed = results.filter((item) => !item.ok);
const passRate = ((passed / total) * 100).toFixed(1);

console.log("---");
console.log(`Regression summary: passed=${passed}/${total} (${passRate}%)`);
if (failed.length === 0) {
  console.log("Failed cases: none");
  process.exit(0);
}
console.log("Failed cases:");
for (const item of failed) {
  console.log(`- ${item.id}: ${item.detail}`);
}
process.exit(1);
