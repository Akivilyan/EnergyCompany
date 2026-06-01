#!/usr/bin/env node
/**
 * Cocos 工程打开前预检（T50-02）：
 * 校验脚本、config、shared 同步与场景资产提示。
 *
 * 用法：
 *   npm run sim:cocos-init-spike
 */
import { execSync } from "node:child_process";
import { runCocosInitChecks, summarizeCocosInitChecks } from "./cocosInitCheck.js";

const repoRoot = process.cwd();
let checks = runCocosInitChecks(repoRoot);

if (checks.some((item) => item.id === "shared-sync" && !item.ok)) {
  console.log("shared assets missing, running build:client...");
  execSync("npm run build:client", { stdio: "inherit", cwd: repoRoot });
  checks = runCocosInitChecks(repoRoot);
}

console.log("=== Energy Company cocos init preflight ===");
for (const item of checks) {
  console.log(`[${item.ok ? "OK" : "MISS"}] ${item.id} | ${item.detail}`);
}

const summary = summarizeCocosInitChecks(checks);
console.log("---");
console.log(`Preflight summary: passed=${summary.passed}/${summary.total}`);
if (summary.advisoryFailed.length > 0) {
  console.log("Editor advisory:");
  for (const item of summary.advisoryFailed) {
    console.log(`- ${item.id}: ${item.detail}`);
  }
  console.log("See docs/design/engineering/cocos-client-setup.md");
}

if (summary.blockingFailed.length > 0) {
  console.log("Blocking failures:");
  for (const item of summary.blockingFailed) {
    console.log(`- ${item.id}: ${item.detail}`);
  }
  process.exit(1);
}

process.exit(0);
