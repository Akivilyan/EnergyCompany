import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import type { ClientNavResult } from "./screenNavController.js";
import { t } from "../i18n/index.js";

/** FAST-01 开发 HUD 默认开研节点：II 级即能演示科技扩容。 */
export const DEFAULT_DEV_TECH_ID = "wind_2";

export interface TechHudCandidate {
  techId: string;
  displayName: string;
  researchCost: number;
  researchMonths: number;
}

export interface TechHudSelectionSnapshot {
  candidates: TechHudCandidate[];
  selectedTechId: string | null;
}

export interface TechHudActionResult {
  ok: boolean;
  view: ClientNavResult["view"];
  uiErrorCode: string | null;
  messageKey: string | null;
}

const selectedTechByBoot = new WeakMap<GameBootstrap, string>();

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

function getResearchCandidates(boot: GameBootstrap): TechHudCandidate[] {
  return boot.app.screens.tech
    .getSnapshot()
    .technologies.filter((tech) => tech.status === "unlocked")
    .map((tech) => ({
      techId: tech.techId,
      displayName: tech.displayName,
      researchCost: tech.researchCost,
      researchMonths: tech.researchMonths
    }));
}

function ensureSelectedCandidate(boot: GameBootstrap): TechHudCandidate | null {
  const candidates = getResearchCandidates(boot);
  if (candidates.length === 0) {
    selectedTechByBoot.delete(boot);
    return null;
  }
  const remembered = selectedTechByBoot.get(boot);
  const selected =
    candidates.find((candidate) => candidate.techId === remembered) ??
    candidates.find((candidate) => candidate.techId === DEFAULT_DEV_TECH_ID) ??
    candidates[0];
  selectedTechByBoot.set(boot, selected.techId);
  return selected;
}

export function getTechHudSelectionSnapshot(boot: GameBootstrap): TechHudSelectionSnapshot {
  const candidates = getResearchCandidates(boot);
  const selected = ensureSelectedCandidate(boot);
  return {
    candidates,
    selectedTechId: selected?.techId ?? null
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
  techId?: string
): TechHudActionResult {
  const selected = ensureSelectedCandidate(boot);
  const targetTechId = techId ?? selected?.techId ?? DEFAULT_DEV_TECH_ID;
  const out = boot.app.screens.tech.startResearch(targetTechId);
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

export function techCycleResearchCandidate(boot: GameBootstrap): TechHudActionResult {
  const candidates = getResearchCandidates(boot);
  if (candidates.length === 0) {
    return toActionResult(
      boot,
      false,
      "action_failed",
      "tech_tree.action.no_research_candidate"
    );
  }
  const current = ensureSelectedCandidate(boot);
  const currentIndex = current
    ? candidates.findIndex((candidate) => candidate.techId === current.techId)
    : -1;
  const next = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
  selectedTechByBoot.set(boot, next.techId);
  return toActionResult(
    boot,
    true,
    null,
    candidates.length > 1
      ? "tech_tree.action.selected_next_candidate"
      : "tech_tree.action.selected_only_candidate"
  );
}

export function formatSelectedResearchCandidate(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) return null;
  return t("hud.status.tech_selected_hint", {
    tech: selected.displayName,
    cost: selected.researchCost,
    months: selected.researchMonths
  });
}
