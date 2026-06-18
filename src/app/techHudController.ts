import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import type { ClientNavResult } from "./screenNavController.js";

/** FAST-01 开发 HUD 默认开研节点：II 级即能演示科技扩容。 */
export const DEFAULT_DEV_TECH_ID = "wind_2";

export interface TechHudActionResult {
  ok: boolean;
  view: ClientNavResult["view"];
  uiErrorCode: string | null;
  messageKey: string | null;
}

function toActionResult(
  boot: GameBootstrap,
  ok: boolean,
  uiErrorCode: string | null,
  messageKey: string | null
): TechHudActionResult {
  return {
    ok,
    view: readCityHudViewModel(boot),
    uiErrorCode,
    messageKey
  };
}

/** 建造 + 推月直到 II 级（开发 HUD / 冒烟用）。 */
export function techEnsureLevelIIForDev(boot: GameBootstrap): { ok: boolean; level: number } {
  const level = () => boot.app.controller.state.companyLevel;
  if (level() >= 2) {
    return { ok: true, level: level() };
  }
  for (let i = 0; i < 2; i += 1) {
    const build = boot.play.buildInCurrentCity("wind", 1);
    if (!build.ok) {
      return { ok: false, level: level() };
    }
  }
  for (let i = 0; i < 12 && level() < 2; i += 1) {
    const advance = boot.play.advanceMonthInCurrentCity();
    if (!advance.ok) {
      return { ok: false, level: level() };
    }
  }
  return { ok: level() >= 2, level: level() };
}

export function techStartDefaultResearch(
  boot: GameBootstrap,
  techId: string = DEFAULT_DEV_TECH_ID
): TechHudActionResult {
  const out = boot.app.screens.tech.startResearch(techId);
  return toActionResult(boot, out.result.ok, out.uiErrorCode, out.uiCopy?.messageKey ?? null);
}

export function techCancelActiveResearch(boot: GameBootstrap): TechHudActionResult {
  const active = boot.app.screens.tech.getSnapshot().activeResearch;
  if (!active) {
    return toActionResult(boot, false, "no_active_research", "tech_tree.error.no_active_research");
  }
  const out = boot.app.screens.tech.cancelResearch(active.researchId);
  return toActionResult(boot, out.result.ok, out.uiErrorCode, out.uiCopy?.messageKey ?? null);
}

export function techSpeedupResearchByAd(boot: GameBootstrap): TechHudActionResult {
  const out = boot.app.screens.tech.speedupResearchByAd();
  return toActionResult(boot, out.result.ok, out.uiErrorCode, out.uiCopy?.messageKey ?? null);
}
