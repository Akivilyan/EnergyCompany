#!/usr/bin/env node
/**
 * 城市页最小闭环 CLI 冒烟：
 * 新局 -> 获取城市快照 -> 下达建造 -> 推进 N 月 -> 打印前后变化
 *
 * 用法：
 *   npm run sim:city-loop
 *   npm run sim:city-loop -- CITY-START wind 1 3
 */
import { createController } from "../modules/runController.js";

const cityId = process.argv[2] ?? "CITY-START";
const facilityId = process.argv[3] ?? "wind";
const tierRaw = process.argv[4] ?? "1";
const monthsRaw = process.argv[5] ?? "3";
const tier = Number.parseInt(tierRaw, 10);
const months = Number.parseInt(monthsRaw, 10);

if (!Number.isInteger(tier) || tier < 1) {
  console.error(`invalid tier: ${tierRaw}`);
  process.exit(1);
}
if (!Number.isInteger(months) || months < 1) {
  console.error(`invalid months: ${monthsRaw}`);
  process.exit(1);
}

const controller = createController();
const step = controller.buildAndAdvance(cityId, facilityId, tier, false);

console.log("=== Energy Company city loop smoke ===");
console.log(
  `target city=${cityId}, facility=${facilityId}, tier=${tier}, months=${months}`
);

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

const advance = controller.advanceMonths(months);
if (advance.failed && !advance.failed.ok) {
  console.log(`settle failed: ${advance.failed.error} - ${advance.failed.message}`);
  process.exit(1);
}

const finalSnapshot = controller.getCitySnapshot(cityId);
console.log(
  `after-settle: month=${finalSnapshot?.month ?? "n/a"}, funds=${finalSnapshot?.funds ?? "n/a"}, sv=${finalSnapshot?.socialValue ?? "n/a"}, ratio=${finalSnapshot?.supplyRatio ?? "n/a"}`
);
const lastReport = advance.reports[advance.reports.length - 1];
console.log(
  `settle reports: count=${advance.reports.length}, last_result=${lastReport?.result ?? "n/a"}, steps=${lastReport?.steps.length ?? 0}`
);
