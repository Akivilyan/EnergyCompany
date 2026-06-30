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
