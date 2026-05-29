#!/usr/bin/env node
/**
 * 事件面板最小闭环 CLI 冒烟：
 * 初始查看 -> 推进到首场固定灾害（M22）-> 全屏确认 -> 推进到 debuff 结束 -> 复查
 *
 * 用法：
 *   npm run sim:events-loop
 *   npm run sim:events-loop -- 23 34
 *     第一个参数：推进至该月查看 active 与 pending
 *     第二个参数：再推进至该月查看 expired
 */
import { createController } from "../modules/runController.js";
import { createScreenEventsPanel } from "../modules/screenEventsPanel.js";

const triggerMonth = Number(process.argv[2] ?? "23");
const expireMonth = Number(process.argv[3] ?? "34");

if (!Number.isInteger(triggerMonth) || !Number.isInteger(expireMonth)) {
  console.log("expect integer months for args");
  process.exit(1);
}

const controller = createController();
controller.state.funds = 10000;
const panel = createScreenEventsPanel(controller);

console.log("=== Energy Company events loop smoke ===");
const initial = panel.getSnapshot();
console.log(
  `month=${initial.month}, upcoming=${initial.upcoming.length}, active=${initial.active.length}, expired=${initial.expired.length}`
);
for (const item of initial.upcoming) {
  console.log(
    `  upcoming seq=${item.seq} trigger@M${item.triggerMonth} in ${item.monthsUntilTrigger}mo isFinal=${item.isFinal}`
  );
}

function settleTo(target: number): void {
  while (controller.state.currentMonth < target && controller.state.runResult === null) {
    const result = controller.runNextMonth();
    if (!result.ok) {
      console.log(`settle failed at month ${controller.state.currentMonth}: ${result.error} - ${result.message}`);
      process.exit(1);
    }
  }
}

settleTo(triggerMonth);
const afterTrigger = panel.getSnapshot();
console.log(
  `after-trigger month=${afterTrigger.month}, active=${afterTrigger.active.length}, pending=${afterTrigger.pendingFullscreen?.seq ?? "none"}`
);
for (const item of afterTrigger.active) {
  console.log(
    `  active seq=${item.seq} remaining=${item.monthsRemaining} pending=${item.needsAcknowledgement} income=${item.incomeMultNum}/${item.incomeMultDen}`
  );
}

const modalCopy = panel.getPendingFullscreenModal();
if (modalCopy) {
  console.log(
    `pending modal copy: title=${modalCopy.copy.titleKey}, summary=${modalCopy.copy.summaryKey}, impact=${modalCopy.copy.impactKey}, action=${modalCopy.copy.acknowledgeButtonKey}`
  );
}

const ack = panel.acknowledgeNextPending();
if (!ack.ok) {
  console.log(`acknowledge failed: ${ack.uiErrorCode}`);
  process.exit(1);
}
console.log(
  `acknowledge: pending ${ack.before.pendingFullscreen?.seq ?? "none"} -> ${ack.after.pendingFullscreen?.seq ?? "none"}, acked_total=${controller.state.acknowledgedDisasterSeqs.length}`
);

settleTo(expireMonth);
const afterExpire = panel.getSnapshot();
console.log(
  `after-expire month=${afterExpire.month}, active=${afterExpire.active.length}, expired=${afterExpire.expired.length}, upcoming=${afterExpire.upcoming.length}`
);
for (const item of afterExpire.expired) {
  console.log(`  expired seq=${item.seq} trigger@M${item.triggerMonth}`);
}
