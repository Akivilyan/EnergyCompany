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
