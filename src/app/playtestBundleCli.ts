#!/usr/bin/env node
/**
 * v0 周五回归聚合 CLI：
 * 串行执行 boundaries + app 装配冒烟 + cocos 场景占位 + FAST-01 完整路线 + E1-E6 regression + unit tests，输出通过率摘要。
 *
 * 用法：
 *   npm run sim:playtest-bundle
 */
import { execSync } from "node:child_process";

interface BundleStep {
  id: string;
  title: string;
  command: string;
}

interface StepResult {
  id: string;
  title: string;
  ok: boolean;
  detail: string;
}

const steps: BundleStep[] = [
  { id: "boundaries", title: "sim 边界护栏", command: "npm run lint:boundaries" },
  { id: "app-shell", title: "app/ui 装配壳层冒烟", command: "npm run sim:app-shell" },
  { id: "save-loop", title: "存档恢复冒烟", command: "npm run sim:save-loop" },
  { id: "cocos-scene", title: "Cocos 场景占位接入", command: "npm run sim:cocos-scene-spike" },
  { id: "verify-client", title: "Cocos 客户端验收 (T50+T49)", command: "npm run verify:client" },
  { id: "fast-demo-route", title: "FAST-01 开局到终局固定路线", command: "npm run sim:fast-demo-route" },
  { id: "regression", title: "E1-E6 体验回归", command: "npm run sim:regression" },
  { id: "unit", title: "单元/模块测试", command: "npm test" }
];

const results: StepResult[] = [];

console.log("=== Energy Company playtest bundle ===");
for (const step of steps) {
  process.stdout.write(`\n>> ${step.id}: ${step.title}\n`);
  try {
    execSync(step.command, { stdio: "inherit", cwd: process.cwd() });
    results.push({ id: step.id, title: step.title, ok: true, detail: "passed" });
    console.log(`[PASS] ${step.id} ${step.title}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ id: step.id, title: step.title, ok: false, detail: message });
    console.log(`[FAIL] ${step.id} ${step.title} | ${message}`);
  }
}

const passed = results.filter((item) => item.ok).length;
const total = results.length;
const passRate = ((passed / total) * 100).toFixed(1);

console.log("\n---");
console.log(`Playtest bundle summary: passed=${passed}/${total} (${passRate}%)`);
const failed = results.filter((item) => !item.ok);
if (failed.length === 0) {
  console.log("Failed steps: none");
  process.exit(0);
}
console.log("Failed steps:");
for (const item of failed) {
  console.log(`- ${item.id}: ${item.detail}`);
}
process.exit(1);
