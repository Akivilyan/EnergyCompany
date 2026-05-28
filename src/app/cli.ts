#!/usr/bin/env node
/**
 * v0 主流程 CLI 冒烟：新局 → 建造 → 推月至终局/破产
 * 用法：npm run sim:demo
 */
import { createController } from "../modules/runController.js";

const controller = createController();
const { state, reports } = controller.playSlice();

console.log("=== Energy Company v0 sim demo ===");
console.log(`result: ${state.runResult ?? "in_progress"}`);
console.log(`month: ${state.currentMonth}, funds: ${state.funds}, sv: ${state.socialValueCurrent}`);
console.log(`level: ${state.companyLevel}, facilities: ${Object.keys(state.facilities).length}`);
console.log(`disasters triggered: [${state.disastersTriggered.join(", ")}]`);
console.log(`active debuffs: ${state.activeDebuffs.length}`);

const disasterMonths = reports
  .filter((r) => r.steps.some((s) => s.stepId === "M11_events_apply" && (s.metrics.disaster_penalty ?? 0) > 0))
  .map((r) => r.monthFrom);
if (disasterMonths.length) {
  console.log(`disaster months (cash hit): ${disasterMonths.join(", ")}`);
}

const last = reports[reports.length - 1];
if (last) {
  const m11 = last.steps.find((s) => s.stepId === "M11_events_apply");
  console.log(`last month M11: ${m11?.summary ?? "n/a"}`);
}
