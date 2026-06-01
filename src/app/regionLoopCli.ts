#!/usr/bin/env node
/**
 * region 页最小闭�?CLI 冒烟�? * Lv1 铺线拦截 -> 正常局建造补供能�?M10 升到 Lv2 -> 区域铺线 -> 推进 1 月看链路完工
 *
 * 用法�? *   npm run sim:region-loop
 *   npm run sim:region-loop -- CITY-START CITY-MAP01-02 region
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenRegion } from "../modules/screenRegion.js";

const fromCityId = process.argv[2] ?? "CITY-START";
const toCityId = process.argv[3] ?? "CITY-MAP01-02";
const linkTypeRaw = process.argv[4] ?? "region";
const linkType = linkTypeRaw === "trunk" ? "trunk" : "region";

const controller = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tech" });
const screen = createScreenRegion(controller);

console.log("=== Energy Company region loop smoke ===");
console.log(
  `target link: ${fromCityId} -> ${toCityId}, type=${linkType}, start_level=${controller.state.companyLevel}`
);

const blocked = screen.queueGridLink(fromCityId, toCityId, linkType);
if (blocked.result.ok) {
  console.log("expected not_unlocked on level I, but link queued");
  process.exit(1);
}
console.log(
  `level I queue: ${blocked.result.error} - ${blocked.result.message}`
);

// 正常局最小升级路径：先补两座风电，再通过 M10 升至 II 级�?for (let i = 0; i < 2; i += 1) {
  const build = controller.runCommand({
    type: "queue_construction",
    cityId: "CITY-START",
    facilityId: "wind",
    tier: 1
  });
  if (!build.ok) {
    console.log(`prebuild failed: ${build.error} - ${build.message}`);
    process.exit(1);
  }
}

const levelUpReports: string[] = [];
for (let i = 0; i < 12 && controller.state.companyLevel < 2; i += 1) {
  const month = screen.advanceOneMonth();
  if (!month.ok) {
    console.log(`level-up settle failed: ${month.error} - ${month.message}`);
    process.exit(1);
  }
  levelUpReports.push(
    `m${i + 1}:${month.value.monthFrom}->${month.value.monthTo} level=${month.value.after.companyLevel} sv=${controller.state.socialValueCurrent}`
  );
}
if (controller.state.companyLevel < 2) {
  console.log("expected company level to reach II in normal run, but it did not");
  process.exit(1);
}
console.log(
  `level-up via M10(normal): month=${controller.state.currentMonth}, level=${controller.state.companyLevel}, sv=${controller.state.socialValueCurrent}, prebuild_months=${levelUpReports.length}`
);
console.log(`level-up trace: ${levelUpReports.join(" | ")}`);

const unlocked = screen.queueGridLink(fromCityId, toCityId, linkType);
if (!unlocked.result.ok) {
  console.log(
    `level II queue failed: ${unlocked.result.error} - ${unlocked.result.message}`
  );
  process.exit(1);
}
console.log(
  `level II queue success: links=${unlocked.after.gridLinks.length}, funds=${unlocked.after.funds}`
);

const advance = screen.advanceMonths(1);
if (advance.failed && !advance.failed.ok) {
  console.log(`settle failed: ${advance.failed.error} - ${advance.failed.message}`);
  process.exit(1);
}
const lastMonth = advance.reports[advance.reports.length - 1];
const afterSettle = screen.getSnapshot();
const latestLink = afterSettle.gridLinks.find(
  (link) =>
    (link.fromCityId === fromCityId && link.toCityId === toCityId) ||
    (link.fromCityId === toCityId && link.toCityId === fromCityId)
);
console.log(
  `after-settle: month=${afterSettle.month}, link_status=${latestLink?.status ?? "n/a"}, months_remaining=${latestLink?.monthsRemaining ?? "n/a"}, settle=${lastMonth?.settleResult ?? "n/a"}`
);
