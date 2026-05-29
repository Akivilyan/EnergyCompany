#!/usr/bin/env node
/**
 * region 页最小闭环 CLI 冒烟：
 * Lv1 铺线拦截 -> tutorial M10 升到 Lv2 -> 区域铺线 -> 推进 1 月看链路完工
 *
 * 用法：
 *   npm run sim:region-loop
 *   npm run sim:region-loop -- CITY-START CITY-MAP01-02 region
 */
import { createController } from "../modules/runController.js";
import { createScreenRegion } from "../modules/screenRegion.js";

const fromCityId = process.argv[2] ?? "CITY-START";
const toCityId = process.argv[3] ?? "CITY-MAP01-02";
const linkTypeRaw = process.argv[4] ?? "region";
const linkType = linkTypeRaw === "trunk" ? "trunk" : "region";

const controller = createController(process.cwd(), { doctrineId: "tutorial" });
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

const levelUpSettle = controller.runNextMonth();
if (!levelUpSettle.ok) {
  console.log(
    `level-up settle failed: ${levelUpSettle.error} - ${levelUpSettle.message}`
  );
  process.exit(1);
}
if (controller.state.companyLevel < 2) {
  console.log("expected company level to reach II via M10, but it did not");
  process.exit(1);
}
console.log(
  `level-up via M10(tutorial): month=${controller.state.currentMonth}, level=${controller.state.companyLevel}, sv=${controller.state.socialValueCurrent}`
);

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

const settle = controller.runNextMonth();
if (!settle.ok) {
  console.log(`settle failed: ${settle.error} - ${settle.message}`);
  process.exit(1);
}
const afterSettle = screen.getSnapshot();
const latestLink = afterSettle.gridLinks.find(
  (link) =>
    (link.fromCityId === fromCityId && link.toCityId === toCityId) ||
    (link.fromCityId === toCityId && link.toCityId === fromCityId)
);
console.log(
  `after-settle: month=${afterSettle.month}, link_status=${latestLink?.status ?? "n/a"}, months_remaining=${latestLink?.monthsRemaining ?? "n/a"}, settle=${settle.value.report.result}`
);
