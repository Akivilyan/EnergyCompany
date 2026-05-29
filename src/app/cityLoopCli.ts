#!/usr/bin/env node
/**
 * 城市页最小闭环 CLI 冒烟：
 * 新局 -> 获取城市快照 -> 下达建造 -> 推进 1 月 -> 打印前后变化
 *
 * 用法：
 *   npm run sim:city-loop
 *   npm run sim:city-loop -- CITY-START wind 1
 */
import { createController } from "../modules/runController.js";

const cityId = process.argv[2] ?? "CITY-START";
const facilityId = process.argv[3] ?? "wind";
const tierRaw = process.argv[4] ?? "1";
const tier = Number.parseInt(tierRaw, 10);

if (!Number.isInteger(tier) || tier < 1) {
  console.error(`invalid tier: ${tierRaw}`);
  process.exit(1);
}

const controller = createController();
const step = controller.buildAndAdvance(cityId, facilityId, tier, true);

console.log("=== Energy Company city loop smoke ===");
console.log(`target city=${cityId}, facility=${facilityId}, tier=${tier}`);

if (!step.before) {
  console.log("before snapshot: city not found");
  process.exit(1);
}

console.log(
  `before: month=${step.before.month}, funds=${step.before.funds}, sv=${step.before.socialValue}, ratio=${step.before.supplyRatio}`
);
console.log(
  `after-build: month=${step.afterBuild?.month ?? "n/a"}, funds=${step.afterBuild?.funds ?? "n/a"}, queue_in_city=${step.afterBuild?.constructionQueueInCity ?? "n/a"}`
);

if (!step.buildResult.ok) {
  console.log(
    `build failed: ${step.buildResult.error} - ${step.buildResult.message}`
  );
  process.exit(1);
}

if (!step.settleResult) {
  console.log("settle skipped");
  process.exit(0);
}
if (!step.settleResult.ok) {
  console.log(
    `settle failed: ${step.settleResult.error} - ${step.settleResult.message}`
  );
  process.exit(1);
}

const report = step.settleResult.value.report;
console.log(
  `after-settle: month=${step.afterSettle?.month ?? "n/a"}, funds=${step.afterSettle?.funds ?? "n/a"}, sv=${step.afterSettle?.socialValue ?? "n/a"}, ratio=${step.afterSettle?.supplyRatio ?? "n/a"}`
);
console.log(`settle result: ${report.result}, steps=${report.steps.length}`);
