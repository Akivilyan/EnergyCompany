#!/usr/bin/env node
/**
 * Playtest 埋点与事件日志导�?CLI（T45-P1-02）：
 * 运行一段最小联调流程后，导出结构化 JSON 事件流�? *
 * 用法�? *   npm run sim:telemetry-export
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { exportPlaytestTelemetry } from "../modules/playtestTelemetry.js";

const controller = createControllerFromRepoRoot();

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

const months = controller.advanceMonths(3);
if (months.failed && !months.failed.ok) {
  console.log(`settle failed: ${months.failed.error} - ${months.failed.message}`);
  process.exit(1);
}

const log = exportPlaytestTelemetry(controller);
console.log(JSON.stringify(log, null, 2));
