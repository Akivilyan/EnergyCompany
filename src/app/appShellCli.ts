#!/usr/bin/env node
/**
 * app/ui 最小装配壳�?CLI 冒烟�? * 导航 -> 城市建�?-> 推月 -> 打开公司屏快照（�?GameBootstrap + SceneHost�? *
 * 用法�? *   npm run sim:app-shell
 */
import { createGameBootstrapFromRepo } from "./gameBootstrap.node.js";
import { LoggingSceneHost } from "../ui/sceneHost.js";

const host = new LoggingSceneHost();
const { app, play } = createGameBootstrapFromRepo({ sceneHost: host });

console.log("=== Energy Company app shell smoke ===");
console.log(
  `start: screen=${play.getNavigation().currentScreen}, city=${play.getNavigation().cityId}, scene=${host.getCurrentScene()}`
);

const build = play.buildInCurrentCity("wind", 1);
if (!build.ok) {
  console.log(`build failed: ${build.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(`build: ok=true, funds=${app.controller.state.funds}, scene=${host.getCurrentScene()}`);

const month = play.advanceMonthInCurrentCity();
if (!month.ok) {
  console.log(`advance failed: ${month.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(
  `advance: ${month.monthFrom}->${month.monthTo}, screen=${play.getNavigation().currentScreen}, scene=${host.getCurrentScene()}`
);

const companyNav = play.openScreen("screen_company");
const company = app.screens.company.getSnapshot();
console.log(
  `company: screen=${companyNav.currentScreen}, scene=${host.getCurrentScene()}, funds=${company.funds}, ads=${company.adsRemaining}, level=${company.companyLevel}`
);

const back = play.back();
console.log(`back: screen=${back.currentScreen}, stack=${back.stack.length}, scene=${host.getCurrentScene()}`);
