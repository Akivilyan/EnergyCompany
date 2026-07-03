import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import type { ClientNavResult } from "./screenNavController.js";
import { t } from "../i18n/index.js";
import type { OperatingPressureTag, WorldMapRegionItem } from "../modules/screenWorldMap.js";

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

interface TechPressureRecommendation {
  region: WorldMapRegionItem;
  pressureTag: OperatingPressureTag;
  candidate: TechHudCandidate;
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

const MIDGAME_RECOMMENDED_TECH_IDS_BY_LEVEL: Record<number, string[]> = {
  3: [
    "grid_regional",
    "storage_system_1",
    "nuclear_1",
    "eng_grid_dispatch",
    "eng_ops_contract",
    "wind_3",
    "solar_3",
    "hydro_3",
    "thermal_3"
  ],
  4: [
    "grid_backbone",
    "storage_system_2",
    "nuclear_2",
    "eng_cashflow",
    "eng_risk_reserve",
    "eco_thermal",
    "eco_nuclear",
    "wind_4",
    "solar_4",
    "hydro_4",
    "thermal_4"
  ]
};

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

function formatOperatingPressureTag(tag: OperatingPressureTag): string {
  const key = `pressure.${tag}`;
  const label = t(key);
  return label === key ? tag : label;
}

function findRecommendedTechCandidate(
  boot: GameBootstrap,
  candidates: TechHudCandidate[]
): TechHudCandidate | null {
  if (boot.app.controller.state.companyLevel <= 2) {
    return candidates.find((candidate) => candidate.techId === DEFAULT_DEV_TECH_ID) ?? null;
  }
  const midgameCandidate = findMidgameRecommendedTechCandidate(boot, candidates);
  if (midgameCandidate) return midgameCandidate;
  const pressureCandidate = findPressureRecommendedTechCandidate(boot, candidates);
  if (pressureCandidate) return pressureCandidate;
  for (const branchKind of RECOMMENDED_TECH_BRANCH_ORDER) {
    const candidate = candidates.find((item) => item.branchKind === branchKind);
    if (candidate) return candidate;
  }
  return null;
}

function midgameRecommendedTechIds(boot: GameBootstrap): string[] {
  return MIDGAME_RECOMMENDED_TECH_IDS_BY_LEVEL[boot.app.controller.state.companyLevel] ?? [];
}

function findMidgameRecommendedTechCandidate(
  boot: GameBootstrap,
  candidates: TechHudCandidate[]
): TechHudCandidate | null {
  return candidateByTechIdOrder(candidates, midgameRecommendedTechIds(boot));
}

function candidateForPressureTag(
  candidates: TechHudCandidate[],
  tag: OperatingPressureTag
): TechHudCandidate | null {
  switch (tag) {
    case "terminal_load":
      return candidateByBranch(candidates, "super_hydro");
    case "trunk_first":
      return candidateByBranch(candidates, "uhv", "backbone_grid", "regional_grid");
    case "nuclear_siting":
      return candidateByBranch(candidates, "nuclear");
    case "hydro_site_bound":
      return candidateByTechId(candidates, (techId) => /^hydro_[2-5]$/.test(techId));
    case "mixed_dispatch":
      return candidateByBranch(candidates, "dispatch");
    case "low_slot_density":
      return candidateByBranch(candidates, "generation_tier");
    case "supply_gap":
      return candidateByBranch(candidates, "storage_gate", "generation_tier");
    case "fossil_transition":
      return candidateByTechIdOrder(candidates, [
        "eco_thermal",
        "eng_ops_contract",
        "eco_nuclear",
        "nuclear_ops"
      ]);
    default:
      return null;
  }
}

function candidateByBranch(
  candidates: TechHudCandidate[],
  ...branchKinds: TechBranchKind[]
): TechHudCandidate | null {
  for (const branchKind of branchKinds) {
    const candidate = candidates.find((item) => item.branchKind === branchKind);
    if (candidate) return candidate;
  }
  return null;
}

function candidateByTechId(
  candidates: TechHudCandidate[],
  predicate: (techId: string) => boolean
): TechHudCandidate | null {
  return candidates.find((candidate) => predicate(candidate.techId)) ?? null;
}

function candidateByTechIdOrder(
  candidates: TechHudCandidate[],
  techIds: string[]
): TechHudCandidate | null {
  for (const techId of techIds) {
    const candidate = candidates.find((item) => item.techId === techId);
    if (candidate) return candidate;
  }
  return null;
}

function latePressureRegions(boot: GameBootstrap): WorldMapRegionItem[] {
  return boot.app.screens.world
    .getSnapshot()
    .regions.filter(
      (region) => region.unlocked && region.unlockCompanyLevel >= 5 && region.supplyGapMw > 0
    );
}

function getPressureRecommendations(
  boot: GameBootstrap,
  candidates: TechHudCandidate[]
): TechPressureRecommendation[] {
  const regions = latePressureRegions(boot);
  if (regions.length === 0) return [];
  const priority: OperatingPressureTag[] = [
    "terminal_load",
    "trunk_first",
    "nuclear_siting",
    "hydro_site_bound",
    "mixed_dispatch",
    "low_slot_density",
    "supply_gap",
    "fossil_transition"
  ];
  const items: TechPressureRecommendation[] = [];
  for (const pressureTag of priority) {
    const region = regions.find((item) => item.operatingPressureTags.includes(pressureTag));
    const candidate = candidateForPressureTag(candidates, pressureTag);
    if (region && candidate) items.push({ region, pressureTag, candidate });
  }
  return items;
}

function findPressureRecommendedTechCandidate(
  boot: GameBootstrap,
  candidates: TechHudCandidate[]
): TechHudCandidate | null {
  return getPressureRecommendations(boot, candidates)[0]?.candidate ?? null;
}

function getOrderedResearchCandidates(boot: GameBootstrap): TechHudCandidate[] {
  const candidates = getResearchCandidates(boot);
  if (boot.app.controller.state.companyLevel <= 2) return candidates;
  const midgameOrderedIds = new Set(midgameRecommendedTechIds(boot));
  if (midgameOrderedIds.size > 0) {
    return [
      ...[...midgameOrderedIds]
        .map((techId) => candidates.find((candidate) => candidate.techId === techId))
        .filter((candidate): candidate is TechHudCandidate => !!candidate),
      ...candidates.filter((candidate) => !midgameOrderedIds.has(candidate.techId))
    ];
  }
  const orderedIds = new Set(
    getPressureRecommendations(boot, candidates).map((item) => item.candidate.techId)
  );
  if (orderedIds.size === 0) return candidates;
  return [
    ...[...orderedIds]
      .map((techId) => candidates.find((candidate) => candidate.techId === techId))
      .filter((candidate): candidate is TechHudCandidate => !!candidate),
    ...candidates.filter((candidate) => !orderedIds.has(candidate.techId))
  ];
}

function pressureTagForCandidate(candidate: TechHudCandidate | null): OperatingPressureTag | null {
  if (!candidate) return null;
  if (/^hydro_[2-5]$/.test(candidate.techId)) return "hydro_site_bound";
  switch (candidate.branchKind) {
    case "super_hydro":
      return "terminal_load";
    case "uhv":
    case "backbone_grid":
    case "regional_grid":
      return "trunk_first";
    case "nuclear":
      return "nuclear_siting";
    case "dispatch":
      return "mixed_dispatch";
    case "generation_tier":
      return "low_slot_density";
    case "storage_gate":
      return "supply_gap";
    case "eco":
    case "opex":
      return "fossil_transition";
    default:
      return null;
  }
}

function ensureSelectedCandidate(boot: GameBootstrap): TechHudCandidate | null {
  const candidates = getOrderedResearchCandidates(boot);
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
  const candidates = getOrderedResearchCandidates(boot);
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
  const candidates = getOrderedResearchCandidates(boot);
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

export function formatActiveResearchCandidate(boot: GameBootstrap): string | null {
  const snapshot = boot.app.screens.tech.getSnapshot();
  const active = snapshot.activeResearch;
  if (!active) return null;
  const tech = snapshot.technologies.find((item) => item.techId === active.techId);
  if (!tech) return null;
  const branchKind = getTechBranchKind(tech.techId);
  return t("hud.status.tech_active_branch_hint", {
    tech: tech.displayName,
    branch: branchKind ? formatTechBranchKind(branchKind) : t("tech.branch.none"),
    months: active.monthsRemaining,
    effect: tech.effectSummary
  });
}

export function formatActiveResearchPressureReason(boot: GameBootstrap): string | null {
  const snapshot = boot.app.screens.tech.getSnapshot();
  const active = snapshot.activeResearch;
  if (!active) return null;
  const tech = snapshot.technologies.find((item) => item.techId === active.techId);
  if (!tech) return null;
  const branchKind = getTechBranchKind(tech.techId);
  if (!branchKind) return null;
  const candidate: TechHudCandidate = {
    techId: tech.techId,
    displayName: tech.displayName,
    researchCost: tech.researchCost,
    researchMonths: tech.researchMonths,
    effectSummary: tech.effectSummary,
    branchKind
  };
  const pressureTag = pressureTagForCandidate(candidate);
  if (!pressureTag) return null;
  const region = latePressureRegions(boot).find((item) =>
    item.operatingPressureTags.includes(pressureTag)
  );
  if (!region) return null;
  return t("hud.status.tech_pressure_reason", {
    region: region.displayName,
    pressure: formatOperatingPressureTag(pressureTag),
    branch: formatTechBranchKind(branchKind)
  });
}

export function formatResearchableTechPressureSummary(boot: GameBootstrap): string | null {
  const candidates = getResearchCandidates(boot);
  if (candidates.length === 0) return null;
  const items = getPressureRecommendations(boot, candidates).map((item) =>
    t("hud.status.tech_pressure_queue_item", {
      region: item.region.displayName,
      pressure: formatOperatingPressureTag(item.pressureTag),
      branch: item.candidate.branchKind
        ? formatTechBranchKind(item.candidate.branchKind)
        : t("tech.branch.none")
    })
  );
  return items.length > 0
    ? t("hud.status.tech_pressure_queue", { items: items.join("/") })
    : null;
}

export function formatSelectedResearchPressureReason(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  const pressureTag = pressureTagForCandidate(selected);
  if (!selected?.branchKind || !pressureTag) return null;
  const region = latePressureRegions(boot).find((item) =>
    item.operatingPressureTags.includes(pressureTag)
  );
  if (!region) return null;
  return t("hud.status.tech_pressure_reason", {
    region: region.displayName,
    pressure: formatOperatingPressureTag(pressureTag),
    branch: formatTechBranchKind(selected.branchKind)
  });
}
