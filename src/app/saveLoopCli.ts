#!/usr/bin/env node
/**
 * 存档恢复最小闭环 CLI 冒烟：
 * 推进两个月 -> 保存 -> 改坏内存态 -> 读档恢复 -> 再推进一月验证可继续。
 *
 * 用法：
 *   npm run sim:save-loop
 */
import { InMemoryStateStorage } from "../infra/storage/stateStorage.js";
import { createRunPersistence } from "../modules/runPersistence.js";
import { createController } from "../modules/runController.js";

console.log("=== Energy Company save loop smoke ===");
const controller = createController();
const storage = new InMemoryStateStorage();
const persistence = createRunPersistence(controller, storage);

const pre = controller.advanceMonths(2);
if (pre.failed && !pre.failed.ok) {
  console.log(`pre-advance failed: ${pre.failed.error} - ${pre.failed.message}`);
  process.exit(1);
}

const save = persistence.save("slot-main");
if (!save.ok) {
  console.log(`save failed: ${save.error} - ${save.message}`);
  process.exit(1);
}
console.log(
  `saved: month=${controller.state.currentMonth}, funds=${controller.state.funds}, at=${save.value.envelope.savedAtUnixMs}`
);

controller.state.currentMonth = 77;
controller.state.funds = -777;
console.log(`mutated runtime: month=${controller.state.currentMonth}, funds=${controller.state.funds}`);

const load = persistence.load("slot-main");
if (!load.ok) {
  console.log(`load failed: ${load.error} - ${load.message}`);
  process.exit(1);
}
console.log(`loaded: month=${controller.state.currentMonth}, funds=${controller.state.funds}`);

const post = controller.runNextMonth();
if (!post.ok) {
  console.log(`post-load advance failed: ${post.error} - ${post.message}`);
  process.exit(1);
}
console.log(`resume: next_month=${controller.state.currentMonth}, result=${post.value.report.result}`);
