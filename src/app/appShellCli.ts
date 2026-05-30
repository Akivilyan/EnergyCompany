#!/usr/bin/env node
/**
 * app/ui 最小装配壳层 CLI 冒烟：
 * 导航 -> 城市建造 -> 推月 -> 打开公司屏快照
 *
 * 用法：
 *   npm run sim:app-shell
 */
import { createGameApp } from "./gameApp.js";
import { createGameShell } from "../ui/gameShell.js";

const app = createGameApp();
const shell = createGameShell(app);

console.log("=== Energy Company app shell smoke ===");
console.log(`start: screen=${shell.getNavigation().currentScreen}, city=${shell.getNavigation().cityId}`);

const build = shell.buildInCurrentCity("wind", 1);
if (!build.ok) {
  console.log(`build failed: ${build.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(`build: ok=true, funds=${app.controller.state.funds}`);

const month = shell.advanceMonthInCurrentCity();
if (!month.ok) {
  console.log(`advance failed: ${month.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(`advance: ${month.monthFrom}->${month.monthTo}, screen=${shell.getNavigation().currentScreen}`);

const companyNav = shell.openScreen("screen_company");
const company = app.screens.company.getSnapshot();
console.log(
  `company: screen=${companyNav.currentScreen}, funds=${company.funds}, ads=${company.adsRemaining}, level=${company.companyLevel}`
);

const back = shell.back();
console.log(`back: screen=${back.currentScreen}, stack=${back.stack.length}`);
