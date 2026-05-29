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

console.log(`monthly advance detail (target=${months}):`);

let advanced = 0;
for (let i = 0; i < months; i += 1) {
  const beforeMonth = controller.getCitySnapshot(cityId);
  const settle = controller.runNextMonth();
  if (!settle.ok) {
    console.log(`settle failed: ${settle.error} - ${settle.message}`);
    process.exit(1);
  }
  const afterMonth = controller.getCitySnapshot(cityId);
  if (!beforeMonth || !afterMonth) {
    console.log("city snapshot missing during monthly advance");
    process.exit(1);
  }
  advanced += 1;
  const fundsDelta = afterMonth.funds - beforeMonth.funds;
  const svDelta = afterMonth.socialValue - beforeMonth.socialValue;
  const localSupplyDelta = afterMonth.localSupplyMw - beforeMonth.localSupplyMw;
  const effectiveSupplyDelta =
    afterMonth.effectiveSupplyMw - beforeMonth.effectiveSupplyMw;
  const ratioDelta = afterMonth.supplyRatio - beforeMonth.supplyRatio;
  console.log(
    `m${advanced}: ${beforeMonth.month}->${afterMonth.month}, funds ${beforeMonth.funds}->${afterMonth.funds} (${fundsDelta >= 0 ? "+" : ""}${fundsDelta}), sv ${beforeMonth.socialValue}->${afterMonth.socialValue} (${svDelta >= 0 ? "+" : ""}${svDelta}), supply local ${beforeMonth.localSupplyMw}->${afterMonth.localSupplyMw} (${localSupplyDelta >= 0 ? "+" : ""}${localSupplyDelta}), effective ${beforeMonth.effectiveSupplyMw}->${afterMonth.effectiveSupplyMw} (${effectiveSupplyDelta >= 0 ? "+" : ""}${effectiveSupplyDelta}), ratio ${beforeMonth.supplyRatio.toFixed(2)}->${afterMonth.supplyRatio.toFixed(2)} (${ratioDelta >= 0 ? "+" : ""}${ratioDelta.toFixed(2)}), settle=${settle.value.report.result}`
  );
  if (settle.value.report.result !== "continue") {
    break;
  }
}

const finalSnapshot = controller.getCitySnapshot(cityId);
console.log(
  `after-settle: month=${finalSnapshot?.month ?? "n/a"}, funds=${finalSnapshot?.funds ?? "n/a"}, sv=${finalSnapshot?.socialValue ?? "n/a"}, ratio=${finalSnapshot?.supplyRatio ?? "n/a"}`
);
const settleTrace = controller.getTrace().filter((entry) => entry.kind === "settle");
const lastReport = settleTrace[settleTrace.length - 1];
console.log(
  `settle reports: count=${settleTrace.length}, advanced=${advanced}, last_result=${lastReport?.result ?? "n/a"}`
);
