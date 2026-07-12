import {
  companyApplySelectedLoan,
  companyClaimCashByAdAsync,
  companyCycleLoanCandidate,
  companySpeedupSelectedConstructionByAdAsync,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

export interface CompanyActionResult {
  ok: boolean;
  messageKey: string | null;
  errorCode: string | null;
}

export function applySelectedCompanyLoan(boot: GameBootstrap): CompanyActionResult {
  const out = companyApplySelectedLoan(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}

export function cycleCompanyLoanCandidate(boot: GameBootstrap): CompanyActionResult {
  const out = companyCycleLoanCandidate(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}

export async function claimCompanyCashByAd(boot: GameBootstrap): Promise<CompanyActionResult> {
  const out = await companyClaimCashByAdAsync(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}

export async function speedupCompanyConstructionByAd(
  boot: GameBootstrap
): Promise<CompanyActionResult> {
  const out = await companySpeedupSelectedConstructionByAdAsync(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}
