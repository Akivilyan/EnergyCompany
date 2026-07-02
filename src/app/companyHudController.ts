import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import type { ClientNavResult } from "./screenNavController.js";
import { t } from "../i18n/index.js";

export interface CompanyHudActionResult {
  ok: boolean;
  view: ClientNavResult["view"];
  uiErrorCode: string | null;
  messageKey: string | null;
}

export interface CompanyHudCandidate {
  loanId: string;
  displayName: string;
  principal: number;
  terms: number;
  monthlyPayment: number;
}

export interface CompanyHudSelectionSnapshot {
  candidates: CompanyHudCandidate[];
  selectedLoanId: string | null;
}

const selectedLoanByBoot = new WeakMap<GameBootstrap, string>();

function toActionResult(boot: GameBootstrap, ok: boolean, uiErrorCode: string | null, messageKey: string | null): CompanyHudActionResult {
  return {
    ok,
    view: readCityHudViewModel(boot),
    uiErrorCode,
    messageKey
  };
}

function getLoanCandidates(boot: GameBootstrap): CompanyHudCandidate[] {
  const snapshot = boot.app.screens.company.getSnapshot();
  return snapshot.loanTierOptions
    .filter((item) => item.unlocked)
    .map((item) => ({
      loanId: item.loanId,
      displayName: t(`loan.tier.${item.loanId}`),
      principal: item.principal,
      terms: item.terms,
      monthlyPayment: item.monthlyPayment
    }));
}

function ensureSelectedCandidate(boot: GameBootstrap): CompanyHudCandidate | null {
  const candidates = getLoanCandidates(boot);
  if (candidates.length === 0) {
    selectedLoanByBoot.delete(boot);
    return null;
  }
  const remembered = selectedLoanByBoot.get(boot);
  const selected = candidates.find((candidate) => candidate.loanId === remembered) ?? candidates[0];
  selectedLoanByBoot.set(boot, selected.loanId);
  return selected;
}

export function getCompanyHudSelectionSnapshot(boot: GameBootstrap): CompanyHudSelectionSnapshot {
  const candidates = getLoanCandidates(boot);
  const selected = ensureSelectedCandidate(boot);
  return {
    candidates,
    selectedLoanId: selected?.loanId ?? null
  };
}

export function formatSelectedLoanCandidate(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) return null;
  return t("hud.status.company_selected_loan", {
    loanName: selected.displayName,
    monthlyPayment: selected.monthlyPayment
  });
}

export function formatCompanyLoanTierBonusLine(boot: GameBootstrap): string | null {
  const snapshot = boot.app.screens.company.getSnapshot();
  if (snapshot.loanTierLevelBonus <= 0) return null;
  return t("hud.status.company_loan_tier_bonus", {
    bonus: snapshot.loanTierLevelBonus,
    effective: snapshot.effectiveLoanLevel
  });
}

export function formatCompanyCashflowOpportunityLine(boot: GameBootstrap): string | null {
  if (boot.app.controller.state.litTechIds.includes("eng_cashflow")) return null;
  const tech = boot.app.controller.config.getTechnology("eng_cashflow");
  if (!tech || boot.app.controller.state.companyLevel < tech.company_level_min) return null;
  const bonus = tech.effect_value.loan_tier_bonus;
  if (typeof bonus !== "number" || !Number.isFinite(bonus) || bonus <= 0) return null;
  return t("hud.status.company_cashflow_opportunity", {
    bonus,
    effective: boot.app.controller.state.companyLevel + bonus
  });
}

function formatOpexTarget(target: string): string {
  const key = `hud.company.opex_target.${target}`;
  const label = t(key);
  return label === key ? target : label;
}

export function formatCompanyOpexTechLine(boot: GameBootstrap): string | null {
  const parts: string[] = [];
  for (const techId of boot.app.controller.state.litTechIds) {
    const tech = boot.app.controller.config.getTechnology(techId);
    if (tech?.effect_type !== "modifier") continue;
    const value = tech.effect_value.opex_pct;
    if (typeof value !== "number" || !Number.isFinite(value) || value === 0) continue;
    parts.push(
      t("hud.status.company_opex_tech_item", {
        target: formatOpexTarget(tech.effect_target),
        pct: Math.abs(value)
      })
    );
  }
  return parts.length > 0
    ? t("hud.status.company_opex_tech", { items: parts.join("/") })
    : null;
}

export function formatCompanyOpexOpportunityLine(boot: GameBootstrap): string | null {
  const lit = new Set(boot.app.controller.state.litTechIds);
  const parts = boot.app.controller.config.bundle.technologies
    .filter((tech) => {
      if (lit.has(tech.tech_id)) return false;
      if (tech.effect_type !== "modifier") return false;
      const value = tech.effect_value.opex_pct;
      if (typeof value !== "number" || !Number.isFinite(value) || value >= 0) return false;
      if (boot.app.controller.state.companyLevel < tech.company_level_min) return false;
      return (tech.requires_lit ?? []).every((techId) => lit.has(techId));
    })
    .map((tech) =>
      t("hud.status.company_opex_tech_item", {
        target: formatOpexTarget(tech.effect_target),
        pct: Math.abs(tech.effect_value.opex_pct as number)
      })
    );
  return parts.length > 0
    ? t("hud.status.company_opex_opportunity", { items: parts.join("/") })
    : null;
}

export function formatCompanyGridDispatchTechLine(boot: GameBootstrap): string | null {
  const parts: string[] = [];
  for (const techId of boot.app.controller.state.litTechIds) {
    const tech = boot.app.controller.config.getTechnology(techId);
    if (tech?.effect_type !== "modifier" || tech.effect_target !== "grid_loss") continue;
    const value = tech.effect_value.regional_loss_pct;
    if (typeof value !== "number" || !Number.isFinite(value) || value === 0) continue;
    parts.push(t("hud.status.company_dispatch_tech_item", { pct: Math.abs(value) }));
  }
  return parts.length > 0
    ? t("hud.status.company_dispatch_tech", { items: parts.join("/") })
    : null;
}

export function formatCompanyGridDispatchOpportunityLine(boot: GameBootstrap): string | null {
  if (boot.app.controller.state.litTechIds.includes("eng_grid_dispatch")) return null;
  const tech = boot.app.controller.config.getTechnology("eng_grid_dispatch");
  if (!tech || boot.app.controller.state.companyLevel < tech.company_level_min) return null;
  const value = tech.effect_value.regional_loss_pct;
  if (typeof value !== "number" || !Number.isFinite(value) || value >= 0) return null;
  return t("hud.status.company_dispatch_opportunity", {
    pct: Math.abs(value)
  });
}

function formatGridTechItems(tech: { effect_value: Record<string, unknown> }): string[] {
  const parts: string[] = [];
  const regionalCost = tech.effect_value.grid_link_cost_pct;
  if (typeof regionalCost === "number" && Number.isFinite(regionalCost) && regionalCost !== 0) {
    parts.push(t("hud.status.company_grid_tech_region_item", { pct: Math.abs(regionalCost) }));
  }
  const trunkCost = tech.effect_value.trunk_link_cost_pct;
  if (typeof trunkCost === "number" && Number.isFinite(trunkCost) && trunkCost !== 0) {
    parts.push(t("hud.status.company_grid_tech_trunk_item", { pct: Math.abs(trunkCost) }));
  }
  if (tech.effect_value.trunk_loss_profile === "uhv") {
    parts.push(t("hud.status.company_grid_tech_uhv_item"));
  }
  return parts;
}

export function formatCompanyGridTechLine(boot: GameBootstrap): string | null {
  const parts: string[] = [];
  for (const techId of boot.app.controller.state.litTechIds) {
    const tech = boot.app.controller.config.getTechnology(techId);
    if (tech?.effect_type !== "grid") continue;
    parts.push(...formatGridTechItems(tech));
  }
  return parts.length > 0
    ? t("hud.status.company_grid_tech", { items: parts.join("/") })
    : null;
}

export function formatCompanyGridOpportunityLine(boot: GameBootstrap): string | null {
  const lit = new Set(boot.app.controller.state.litTechIds);
  const parts = boot.app.controller.config.bundle.technologies
    .filter((tech) => {
      if (lit.has(tech.tech_id)) return false;
      if (tech.effect_type !== "grid") return false;
      if (boot.app.controller.state.companyLevel < tech.company_level_min) return false;
      return (tech.requires_lit ?? []).every((techId) => lit.has(techId));
    })
    .flatMap(formatGridTechItems);
  return parts.length > 0
    ? t("hud.status.company_grid_opportunity", { items: parts.join("/") })
    : null;
}

export function formatCompanyNuclearTechLine(boot: GameBootstrap): string | null {
  let tierMax = 0;
  for (const techId of boot.app.controller.state.litTechIds) {
    const tech = boot.app.controller.config.getTechnology(techId);
    if (tech?.effect_type !== "facility_tier" || tech.effect_target !== "nuclear") continue;
    const value = tech.effect_value.tier_max;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    tierMax = Math.max(tierMax, value);
  }
  return tierMax > 0 ? t("hud.status.company_nuclear_tech", { tier: tierMax }) : null;
}

export function formatCompanyNuclearOpportunityLine(boot: GameBootstrap): string | null {
  const lit = new Set(boot.app.controller.state.litTechIds);
  let tierMax = 0;
  for (const tech of boot.app.controller.config.bundle.technologies) {
    if (lit.has(tech.tech_id)) continue;
    if (tech.effect_type !== "facility_tier" || tech.effect_target !== "nuclear") continue;
    if (boot.app.controller.state.companyLevel < tech.company_level_min) continue;
    if (!(tech.requires_lit ?? []).every((techId) => lit.has(techId))) continue;
    const value = tech.effect_value.tier_max;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    tierMax = Math.max(tierMax, value);
  }
  return tierMax > 0 ? t("hud.status.company_nuclear_opportunity", { tier: tierMax }) : null;
}

function formatGenerationTechTarget(target: string): string {
  const key = `hud.company.generation_target.${target}`;
  const label = t(key);
  return label === key ? target : label;
}

const generationTechTargetOrder = ["wind", "solar", "thermal", "hydro"];

function compareGenerationTechTarget(a: string, b: string): number {
  return generationTechTargetOrder.indexOf(a) - generationTechTargetOrder.indexOf(b);
}

interface CompanyGenerationTechLike {
  effect_type: string;
  effect_target: string;
  effect_value: Record<string, unknown>;
}

function formatGenerationTechItems(technologies: CompanyGenerationTechLike[]): string[] {
  const tierByTarget = new Map<string, number>();
  for (const tech of technologies) {
    if (tech.effect_type !== "facility_tier" || tech.effect_target === "nuclear") continue;
    const value = tech.effect_value.tier_max;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 1) continue;
    tierByTarget.set(
      tech.effect_target,
      Math.max(tierByTarget.get(tech.effect_target) ?? 0, value)
    );
  }
  const parts = Array.from(tierByTarget.entries())
    .sort(([a], [b]) => compareGenerationTechTarget(a, b))
    .map(([target, tier]) =>
      t("hud.status.company_generation_tech_item", {
        target: formatGenerationTechTarget(target),
        tier
      })
    );
  return parts;
}

export function formatCompanyGenerationTechLine(boot: GameBootstrap): string | null {
  const technologies = boot.app.controller.state.litTechIds
    .map((techId) => boot.app.controller.config.getTechnology(techId))
    .filter((tech): tech is NonNullable<typeof tech> => !!tech);
  const parts = formatGenerationTechItems(technologies);
  return parts.length > 0
    ? t("hud.status.company_generation_tech", { items: parts.join("/") })
    : null;
}

export function formatCompanyGenerationOpportunityLine(boot: GameBootstrap): string | null {
  const lit = new Set(boot.app.controller.state.litTechIds);
  const technologies = boot.app.controller.config.bundle.technologies.filter((tech) => {
    if (lit.has(tech.tech_id)) return false;
    if (tech.effect_type !== "facility_tier" || tech.effect_target === "nuclear") return false;
    if (tech.company_level_min < 3) return false;
    if (boot.app.controller.state.companyLevel < tech.company_level_min) return false;
    return (tech.requires_lit ?? []).every((techId) => lit.has(techId));
  });
  const parts = formatGenerationTechItems(technologies);
  return parts.length > 0
    ? t("hud.status.company_generation_opportunity", { items: parts.join("/") })
    : null;
}

interface CompanyStorageTechLike {
  effect_type: string;
  effect_value: Record<string, unknown>;
}

function formatStorageTechItems(technologies: CompanyStorageTechLike[]): string[] {
  let storageMult = 0;
  const unlockTiers = new Set<number>();
  for (const tech of technologies) {
    if (tech.effect_type !== "storage_buff" && tech.effect_type !== "storage_gate") continue;
    const tier = tech.effect_value.unlock_tier;
    if (typeof tier === "number" && Number.isFinite(tier) && tier > 0) {
      unlockTiers.add(tier);
    }
    const value = tech.effect_value.storage_mult;
    if (typeof value === "number" && Number.isFinite(value) && value > 1) {
      storageMult = Math.max(storageMult, value);
    }
  }
  const parts: string[] = [];
  if (storageMult > 1) {
    parts.push(t("hud.status.company_storage_tech_mult_item", { mult: storageMult }));
  }
  if (unlockTiers.size > 0) {
    const tiers = Array.from(unlockTiers).sort((a, b) => a - b).join("/");
    parts.push(t("hud.status.company_storage_tech_gate_item", { tiers }));
  }
  return parts;
}

export function formatCompanyStorageTechLine(boot: GameBootstrap): string | null {
  const technologies = boot.app.controller.state.litTechIds
    .map((techId) => boot.app.controller.config.getTechnology(techId))
    .filter((tech): tech is NonNullable<typeof tech> => !!tech);
  const parts = formatStorageTechItems(technologies);
  return parts.length > 0
    ? t("hud.status.company_storage_tech", { items: parts.join("/") })
    : null;
}

export function formatCompanyStorageOpportunityLine(boot: GameBootstrap): string | null {
  const lit = new Set(boot.app.controller.state.litTechIds);
  const technologies = boot.app.controller.config.bundle.technologies.filter((tech) => {
    if (lit.has(tech.tech_id)) return false;
    if (tech.effect_type !== "storage_buff" && tech.effect_type !== "storage_gate") return false;
    if (boot.app.controller.state.companyLevel < tech.company_level_min) return false;
    return (tech.requires_lit ?? []).every((techId) => lit.has(techId));
  });
  const parts = formatStorageTechItems(technologies);
  return parts.length > 0
    ? t("hud.status.company_storage_opportunity", { items: parts.join("/") })
    : null;
}

export function formatCompanyStrategicTechLine(boot: GameBootstrap): string | null {
  const parts: string[] = [];
  for (const techId of boot.app.controller.state.litTechIds) {
    const tech = boot.app.controller.config.getTechnology(techId);
    if (tech?.effect_type !== "strategic_project" || tech.effect_target !== "super_hydro") continue;
    const value = tech.effect_value.slot_count;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    parts.push(t("hud.status.company_strategic_tech_super_hydro_item", { count: value }));
  }
  return parts.length > 0
    ? t("hud.status.company_strategic_tech", { items: parts.join("/") })
    : null;
}

export function formatCompanyStrategicOpportunityLine(boot: GameBootstrap): string | null {
  const lit = new Set(boot.app.controller.state.litTechIds);
  const parts: string[] = [];
  for (const tech of boot.app.controller.config.bundle.technologies) {
    if (lit.has(tech.tech_id)) continue;
    if (tech.effect_type !== "strategic_project" || tech.effect_target !== "super_hydro") continue;
    if (boot.app.controller.state.companyLevel < tech.company_level_min) continue;
    if (!(tech.requires_lit ?? []).every((techId) => lit.has(techId))) continue;
    const value = tech.effect_value.slot_count;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    parts.push(t("hud.status.company_strategic_tech_super_hydro_item", { count: value }));
  }
  return parts.length > 0
    ? t("hud.status.company_strategic_opportunity", { items: parts.join("/") })
    : null;
}

function formatEcoSyncTarget(target: string): string {
  const key = `hud.company.eco_target.${target}`;
  const label = t(key);
  return label === key ? target : label;
}

export function formatCompanyEcoTechLine(boot: GameBootstrap): string | null {
  const parts: string[] = [];
  for (const techId of boot.app.controller.state.litTechIds) {
    const tech = boot.app.controller.config.getTechnology(techId);
    if (!tech) continue;
    if (tech.effect_type === "eco_sync") {
      parts.push(
        t("hud.status.company_eco_tech_sync_item", {
          target: formatEcoSyncTarget(tech.effect_target)
        })
      );
      continue;
    }
    if (tech.effect_type !== "modifier" || tech.effect_target !== "social_value") continue;
    const value = tech.effect_value.eco_city_sv_pct;
    if (typeof value !== "number" || !Number.isFinite(value) || value === 0) continue;
    parts.push(t("hud.status.company_eco_tech_sv_item", { pct: Math.abs(value) }));
  }
  return parts.length > 0
    ? t("hud.status.company_eco_tech", { items: parts.join("/") })
    : null;
}

export function formatCompanyGreenBrandOpportunityLine(boot: GameBootstrap): string | null {
  if (boot.app.controller.state.litTechIds.includes("eng_green_pr")) return null;
  const tech = boot.app.controller.config.getTechnology("eng_green_pr");
  if (!tech || boot.app.controller.state.companyLevel < tech.company_level_min) return null;
  const value = tech.effect_value.eco_city_sv_pct;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const ecoCities = Object.values(boot.app.controller.state.cities).filter(
    (city) => city.cityFullyEcoSupply
  ).length;
  if (ecoCities <= 0) return null;
  return t("hud.status.company_green_brand_opportunity", {
    count: ecoCities,
    pct: value
  });
}

export function companyApplySelectedLoan(
  boot: GameBootstrap,
  loanId?: string
): CompanyHudActionResult {
  const selected = ensureSelectedCandidate(boot);
  const targetLoanId = loanId ?? selected?.loanId;
  if (!targetLoanId) {
    return toActionResult(boot, false, "loan_not_found", "company.error.loan_not_found");
  }
  const out = boot.app.screens.company.applyLoan(targetLoanId);
  return toActionResult(boot, out.result.ok, out.uiErrorCode, out.uiCopy?.messageKey ?? null);
}

export function companyApplyFirstUnlockedLoan(boot: GameBootstrap): CompanyHudActionResult {
  return companyApplySelectedLoan(boot);
}

export function companyCycleLoanCandidate(boot: GameBootstrap): CompanyHudActionResult {
  const candidates = getLoanCandidates(boot);
  if (candidates.length === 0) {
    return toActionResult(boot, false, "loan_not_found", "company.action.no_loan_candidate");
  }
  const current = ensureSelectedCandidate(boot);
  const currentIndex = current
    ? candidates.findIndex((candidate) => candidate.loanId === current.loanId)
    : -1;
  const next = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
  selectedLoanByBoot.set(boot, next.loanId);
  return toActionResult(
    boot,
    true,
    null,
    candidates.length > 1
      ? "company.action.selected_next_candidate"
      : "company.action.selected_only_candidate"
  );
}

export function companyClaimCashByAd(boot: GameBootstrap): CompanyHudActionResult {
  const out = boot.app.screens.company.claimCashByAd();
  return toActionResult(
    boot,
    out.result.ok,
    out.uiErrorCode,
    out.uiCopy?.messageKey ?? null
  );
}
