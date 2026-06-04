import type { GameBootstrap } from "./gameBootstrap.js";
import { buildClientHudDisplay } from "./clientHudDisplay.js";

/** 按当前 screen 生成顶栏主文案（兼容旧调用）。 */
export function formatClientHudStatus(boot: GameBootstrap): string {
  return buildClientHudDisplay(boot).statusLine;
}
