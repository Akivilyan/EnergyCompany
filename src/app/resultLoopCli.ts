#!/usr/bin/env node
/**
 * 终局页最小闭�?CLI 冒烟�? * 分别构�?victory / bankrupt 分支，并验证 run_result 快照可读且命令被禁用�? *
 * 用法�? *   npm run sim:result-loop
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenRunResult } from "../modules/screenRunResult.js";

function runVictoryBranch(): void {
  const controller = createControllerFromRepoRoot();
  const finalDisaster = controller.config.bundle.disasters.find((item) => item.is_final);
  if (!finalDisaster) {
    console.log("victory branch failed: missing final disaster config");
    process.exit(1);
  }
  controller.state.currentMonth = controller.config.bundle.runConfig.campaign_run_target_months;
  controller.state.disastersTriggered.push(finalDisaster.seq);
  controller.state.funds = 20;
  controller.state.cities["CITY-START"].demandMw = 0;
  const month = controller.runNextMonth();
  if (!month.ok) {
    console.log(`victory settle failed: ${month.error} - ${month.message}`);
    process.exit(1);
  }
  const screen = createScreenRunResult(controller);
  const snapshot = screen.getSnapshot();
  if (!snapshot) {
    console.log("victory screen snapshot missing");
    process.exit(1);
  }
  const blocked = controller.runCommand({ type: "claim_ad_reward", adType: "cash" });
  console.log(
    `victory: result=${snapshot.runResult}, month=${snapshot.month}, finalTriggered=${snapshot.finalDisasterTriggered}, commandBlocked=${!blocked.ok}`
  );
}

function runBankruptBranch(): void {
  const controller = createControllerFromRepoRoot();
  controller.state.funds = -100;
  controller.state.bankruptConsecutiveMonths =
    controller.config.bundle.runConfig.bankrupt_consecutive_months - 1;
  controller.state.cities["CITY-START"].demandMw = 0;
  const month = controller.runNextMonth();
  if (!month.ok) {
    console.log(`bankrupt settle failed: ${month.error} - ${month.message}`);
    process.exit(1);
  }
  const screen = createScreenRunResult(controller);
  const snapshot = screen.getSnapshot();
  if (!snapshot) {
    console.log("bankrupt screen snapshot missing");
    process.exit(1);
  }
  const blocked = controller.runCommand({
    type: "queue_construction",
    cityId: "CITY-START",
    facilityId: "wind",
    tier: 1
  });
  console.log(
    `bankrupt: result=${snapshot.runResult}, month=${snapshot.month}, funds=${snapshot.funds}, commandBlocked=${!blocked.ok}`
  );
}

console.log("=== Energy Company run-result loop smoke ===");
runVictoryBranch();
runBankruptBranch();
