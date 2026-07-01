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
  effectSummary: string;
  branchKind: TechBranchKind | null;
}

export interface TechHudSelectionSnapshot {
  candidates: TechHudCandidate[];
  selectedTechId: string | null;
}

export type TechBranchKind =
  | "generation_tier"
  | "storage_gate"
  | "regional_grid"
  | "backbone_grid"
  | "uhv"
  | "nuclear"
  | "eco"
  | "super_hydro"
  | "construction"
  | "opex"
  | "dispatch"
  | "cashflow"
  | "risk"
  | "green_pr";

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
      researchMonths: tech.researchMonths,
      effectSummary: tech.effectSummary,
      branchKind: getTechBranchKind(tech.techId)
    }));
}

function getTechBranchKind(techId: string): TechBranchKind | null {
  if (/^(wind|solar|thermal|hydro)_[2-5]$/.test(techId)) return "generation_tier";
  if (techId.startsWith("storage_system_")) return "storage_gate";
  if (techId === "grid_regional") return "regional_grid";
  if (techId === "grid_backbone") return "backbone_grid";
  if (techId === "uhv_transmission") return "uhv";
  if (techId === "eng_ops_contract" || techId === "nuclear_ops") return "opex";
  if (techId.startsWith("nuclear_")) return "nuclear";
  if (techId === "eco_thermal" || techId === "eco_nuclear") return "eco";
  if (techId === "super_hydro") return "super_hydro";
  if (techId === "eng_bulk_procure") return "construction";
  if (techId === "eng_grid_dispatch") return "dispatch";
  if (techId === "eng_cashflow") return "cashflow";
  if (techId === "eng_risk_reserve") return "risk";
  if (techId === "eng_green_pr") return "green_pr";
  return null;
}

const TECH_BRANCH_ORDER: TechBranchKind[] = [
  "generation_tier",
  "storage_gate",
  "regional_grid",
  "backbone_grid",
  "uhv",
  "nuclear",
  "eco",
  "super_hydro",
  "construction",
  "opex",
  "dispatch",
  "cashflow",
  "risk",
  "green_pr"
];

const RECOMMENDED_TECH_BRANCH_ORDER: TechBranchKind[] = [
  "super_hydro",
  "storage_gate",
  "uhv",
  "backbone_grid",
  "regional_grid",
  "nuclear",
  "eco",
  "generation_tier",
  "dispatch",
  "opex",
  "cashflow",
  "risk",
  "green_pr",
  "construction"
];

function formatTechBranchKind(kind: TechBranchKind): string {
  const key = `tech.branch.${kind}`;
  const label = t(key);
  return label === key ? kind : label;
}

function formatTechBranchKinds(kinds: TechBranchKind[]): string {
  return kinds.length > 0
    ? kinds.map(formatTechBranchKind).join("/")
    : t("tech.branch.none");
}

function formatTechBranchCounts(counts: Map<TechBranchKind, number>): string {
  const parts = TECH_BRANCH_ORDER
    .map((kind) => {
      const count = counts.get(kind) ?? 0;
      return count > 0 ? t("hud.status.tech_researchable_branch_item", {
        branch: formatTechBranchKind(kind),
        count
      }) : null;
    })
    .filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join("/") : t("tech.branch.none");
}

export function formatTechProgressionSummary(boot: GameBootstrap): string | null {
  const levels = [3, 4, 5] as const;
  const technologies = boot.app.screens.tech.getSnapshot().technologies;
  const parts = levels.map((level) => {
    const branches = new Set<TechBranchKind>();
    for (const tech of technologies) {
      if (tech.companyLevelMin !== level) continue;
      const kind = getTechBranchKind(tech.techId);
      if (kind) branches.add(kind);
    }
    const ordered = TECH_BRANCH_ORDER.filter((kind) => branches.has(kind));
    return t("hud.status.tech_branch_level", {
      level,
      branches: formatTechBranchKinds(ordered)
    });
  });
  return parts.length > 0 ? t("hud.status.tech_branch_summary", { branches: parts.join(" · ") }) : null;
}

export function formatResearchableTechBranchSummary(boot: GameBootstrap): string | null {
  const candidates = getResearchCandidates(boot);
  if (candidates.length === 0) return null;
  const counts = new Map<TechBranchKind, number>();
  for (const candidate of candidates) {
    if (!candidate.branchKind) continue;
    counts.set(candidate.branchKind, (counts.get(candidate.branchKind) ?? 0) + 1);
  }
  return t("hud.status.tech_researchable_branch_summary", {
    branches: formatTechBranchCounts(counts)
  });
}

function findRecommendedTechCandidate(
  boot: GameBootstrap,
  candidates: TechHudCandidate[]
): TechHudCandidate | null {
  if (boot.app.controller.state.companyLevel <= 2) {
    return candidates.find((candidate) => candidate.techId === DEFAULT_DEV_TECH_ID) ?? null;
  }
  for (const branchKind of RECOMMENDED_TECH_BRANCH_ORDER) {
    const candidate = candidates.find((item) => item.branchKind === branchKind);
    if (candidate) return candidate;
  }
  return null;
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
    findRecommendedTechCandidate(boot, candidates) ??
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
    branch: selected.branchKind ? formatTechBranchKind(selected.branchKind) : t("tech.branch.none"),
    cost: selected.researchCost,
    months: selected.researchMonths,
    effect: selected.effectSummary
  });
}
