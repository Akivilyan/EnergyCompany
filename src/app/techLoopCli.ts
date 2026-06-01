#!/usr/bin/env node
/**
 * 科技树最小闭�?CLI 冒烟�? * 升到 II �?-> 开�?-> 取消返还 -> 再开�?-> 推月点亮
 *
 * 用法�? *   npm run sim:tech-loop
 *   npm run sim:tech-loop -- storage_system_1
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenTechTree } from "../modules/screenTechTree.js";

const techId = process.argv[2] ?? "storage_system_1";
const controller = createControllerFromRepoRoot();
const screen = createScreenTechTree(controller);

console.log("=== Energy Company tech loop smoke ===");
console.log(`target tech=${techId}, start_level=${controller.state.companyLevel}`);

if (controller.state.companyLevel < 2) {
  for (let i = 0; i < 2; i += 1) {
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
  for (let i = 0; i < 12 && controller.state.companyLevel < 2; i += 1) {
    const pre = controller.runNextMonth();
    if (!pre.ok) {
      console.log(`pre-advance failed: ${pre.error} - ${pre.message}`);
      process.exit(1);
    }
  }
}

if (controller.state.companyLevel < 2) {
  console.log("expected level II before tech-loop, but not reached");
  process.exit(1);
}
console.log(
  `level-ready: month=${controller.state.currentMonth}, level=${controller.state.companyLevel}, funds=${controller.state.funds}`
);

const firstStart = screen.startResearch(techId);
if (!firstStart.result.ok) {
  console.log(`start failed: ${firstStart.result.error} - ${firstStart.result.message}`);
  process.exit(1);
}
const active = screen.getSnapshot().activeResearch;
if (!active) {
  console.log("start failed: active research missing");
  process.exit(1);
}
console.log(
  `start research: id=${active.researchId}, months=${active.monthsRemaining}, funds=${screen.getSnapshot().funds}`
);

const cancel = screen.cancelResearch(active.researchId);
if (!cancel.result.ok) {
  console.log(`cancel failed: ${cancel.result.error} - ${cancel.result.message}`);
  process.exit(1);
}
console.log(
  `cancel research: funds ${cancel.before.funds}->${cancel.after.funds}, active=${cancel.after.activeResearch ? "yes" : "no"}`
);

const secondStart = screen.startResearch(techId);
if (!secondStart.result.ok) {
  console.log(`restart failed: ${secondStart.result.error} - ${secondStart.result.message}`);
  process.exit(1);
}
console.log(
  `restart research: funds=${secondStart.after.funds}, active=${secondStart.after.activeResearch?.researchId ?? "n/a"}`
);

const advance = controller.advanceMonths(3);
if (advance.failed && !advance.failed.ok) {
  console.log(`settle failed: ${advance.failed.error} - ${advance.failed.message}`);
  process.exit(1);
}
const final = screen.getSnapshot();
console.log(
  `after-settle: month=${final.month}, lit=${final.litTechIds.includes(techId)}, active=${final.activeResearch ? "yes" : "no"}, funds=${final.funds}`
);
