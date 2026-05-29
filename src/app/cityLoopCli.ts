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
import { createScreenCityDetail } from "../modules/screenCityDetail.js";

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
const screen = createScreenCityDetail(controller, cityId);
const before = screen.getSnapshot();

console.log("=== Energy Company city loop smoke ===");
console.log(
  `target city=${cityId}, facility=${facilityId}, tier=${tier}, months=${months}`
);

if (!before) {
  console.log("before snapshot: city not found");
  process.exit(1);
}

console.log(
  `before: month=${before.month}, funds=${before.funds}, sv=${before.socialValue}, ratio=${before.supplyRatio}`
);
const build = screen.queueConstruction(facilityId, tier);
console.log(
  `after-build: month=${build.ok ? build.value.after.month : "n/a"}, funds=${build.ok ? build.value.after.funds : "n/a"}, queue_in_city=${build.ok ? build.value.after.constructionQueueInCity : "n/a"}`
);

if (!build.ok) {
  console.log(`build failed: ${build.error} - ${build.message}`);
  process.exit(1);
}

if (!build.value.result.ok) {
  console.log(
    `build failed: ${build.value.result.error} - ${build.value.result.message}`
  );
  process.exit(1);
}

console.log(`monthly advance detail (target=${months}):`);
const advance = screen.advanceMonths(months);
if (advance.failed && !advance.failed.ok) {
  console.log(`settle failed: ${advance.failed.error} - ${advance.failed.message}`);
  process.exit(1);
}
for (const [index, month] of advance.reports.entries()) {
  const advanced = index + 1;
  const beforeMonth = month.before;
  const afterMonth = month.after;
  const fundsDelta = month.delta.funds;
  const svDelta = month.delta.socialValue;
  const localSupplyDelta = month.delta.localSupplyMw;
  const effectiveSupplyDelta = month.delta.effectiveSupplyMw;
  const ratioDelta = month.delta.supplyRatio;
  console.log(
    `m${advanced}: ${month.monthFrom}->${month.monthTo}, funds ${beforeMonth.funds}->${afterMonth.funds} (${fundsDelta >= 0 ? "+" : ""}${fundsDelta}), sv ${beforeMonth.socialValue}->${afterMonth.socialValue} (${svDelta >= 0 ? "+" : ""}${svDelta}), supply local ${beforeMonth.localSupplyMw}->${afterMonth.localSupplyMw} (${localSupplyDelta >= 0 ? "+" : ""}${localSupplyDelta}), effective ${beforeMonth.effectiveSupplyMw}->${afterMonth.effectiveSupplyMw} (${effectiveSupplyDelta >= 0 ? "+" : ""}${effectiveSupplyDelta}), ratio ${beforeMonth.supplyRatio.toFixed(2)}->${afterMonth.supplyRatio.toFixed(2)} (${ratioDelta >= 0 ? "+" : ""}${ratioDelta.toFixed(2)}), settle=${month.settleResult}`
  );
}

const finalSnapshot = controller.getCitySnapshot(cityId);
console.log(
  `after-settle: month=${finalSnapshot?.month ?? "n/a"}, funds=${finalSnapshot?.funds ?? "n/a"}, sv=${finalSnapshot?.socialValue ?? "n/a"}, ratio=${finalSnapshot?.supplyRatio ?? "n/a"}`
);
const settleTrace = controller.getTrace().filter((entry) => entry.kind === "settle");
const lastReport = settleTrace[settleTrace.length - 1];
console.log(
  `settle reports: count=${settleTrace.length}, advanced=${advance.reports.length}, last_result=${lastReport?.result ?? "n/a"}`
);
