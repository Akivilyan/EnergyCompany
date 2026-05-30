#!/usr/bin/env node
/**
 * 存档恢复最小闭环 CLI 冒烟：
 * 推进两个月 -> 保存 -> 改坏内存态 -> 读档恢复 -> 再推进一月验证可继续。
 *
 * 用法：
 *   npm run sim:save-loop
 */
import { createGameBootstrap } from "./gameBootstrap.js";

console.log("=== Energy Company save loop smoke ===");
const { app, play } = createGameBootstrap();

for (let i = 0; i < 2; i += 1) {
  const month = play.advanceMonthInCurrentCity();
  if (!month.ok) {
    console.log(`pre-advance failed: ${month.errorCode ?? "unknown"}`);
    process.exit(1);
  }
}

const save = play.saveSlot("slot-main");
if (!save.ok) {
  console.log(`save failed: ${save.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(
  `saved: month=${app.controller.state.currentMonth}, funds=${app.controller.state.funds}, at=${save.savedAtUnixMs ?? "unknown"}`
);

app.controller.state.currentMonth = 77;
app.controller.state.funds = -777;
console.log(`mutated runtime: month=${app.controller.state.currentMonth}, funds=${app.controller.state.funds}`);

const load = play.loadSlot("slot-main");
if (!load.ok) {
  console.log(`load failed: ${load.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(`loaded: month=${app.controller.state.currentMonth}, funds=${app.controller.state.funds}`);

const post = play.advanceMonthInCurrentCity();
if (!post.ok) {
  console.log(`post-load advance failed: ${post.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(`resume: next_month=${app.controller.state.currentMonth}, screen=${play.getNavigation().currentScreen}`);
