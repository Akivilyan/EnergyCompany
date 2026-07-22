import type { GameState, SimResult } from "../sim/index.js";
import { getLoanTierLevelBonus } from "../sim/index.js";
import type { LoanTierConfig } from "../sim/config/configRepo.js";
import type { SettlementReport, SettlementStepId } from "../sim/types/settlement.js";
import type { RewardedAdProvider } from "../infra/monetization/rewardedAdProvider.js";
import {
  createDefaultAdRewardService,
  createAdRewardService,
  type AdRewardService,
  type AdRewardUiErrorCode
} from "./adRewardService.js";
import type { RunController } from "./runController.js";
import {
  buildCompanyGrowthSnapshot,
  type CompanyGrowthSnapshot
} from "./companyGrowth.js";

export type CompanyUiErrorCode =
  | "loan_not_found"
  | "loan_tier_locked"
  | "loan_already_active"
  | "ad_not_completed"
  | "ad_provider_failed"
  | "ad_in_progress"
  | "ads_exhausted"
  | "no_active_construction"
  | "action_invalid"
  | "action_failed";

export interface CompanyUiCopySpec {
  messageKey: string;
  actionKey: string;
}

export const COMPANY_UI_COPY: Record<CompanyUiErrorCode, CompanyUiCopySpec> = {
  loan_not_found: {
    messageKey: "company.error.loan_not_found",
    actionKey: "company.action.refresh_loan_tiers"
  },
  loan_tier_locked: {
    messageKey: "company.error.loan_tier_locked",
    actionKey: "company.action.level_up_first"
  },
  loan_already_active: {
    messageKey: "company.error.loan_already_active",
    actionKey: "company.action.wait_or_repay"
  },
  ad_not_completed: {
    messageKey: "company.error.ad_not_completed",
    actionKey: "company.action.retry_ad"
  },
  ad_provider_failed: {
    messageKey: "company.error.ad_provider_failed",
    actionKey: "company.action.retry_ad"
  },
  ad_in_progress: {
    messageKey: "company.error.ad_in_progress",
    actionKey: "company.action.wait_ad"
  },
  ads_exhausted: {
    messageKey: "company.error.ads_exhausted",
    actionKey: "company.action.close_ad_panel"
  },
  no_active_construction: {
    messageKey: "company.error.no_active_construction",
    actionKey: "company.action.start_build_first"
  },
  action_invalid: {
    messageKey: "company.error.action_invalid",
    actionKey: "company.action.return_to_playable"
  },
  action_failed: {
    messageKey: "company.error.action_failed",
    actionKey: "company.action.retry"
  }
};

export interface CompanyLoanTierOption {
  loanId: string;
  principal: number;
  terms: number;
  monthlyPayment: number;
  totalInterest: number;
  unlockLevel: number;
  unlocked: boolean;
}

export interface CompanySnapshot {
  month: number;
  funds: number;
  companyLevel: number;
  effectiveLoanLevel: number;
  loanTierLevelBonus: number;
  socialValue: number;
  gridRegionalLit: boolean;
  runResult: GameState["runResult"];
  adsRemaining: number;
  activeLoan: {
    loanId: string;
    principalRemaining: number;
    monthlyPayment: number;
    monthsRemaining: number;
  } | null;
  loanTierOptions: CompanyLoanTierOption[];
  canApplyLoan: boolean;
  activeConstruction: CompanyConstructionQueueItem[];
  growth: CompanyGrowthSnapshot;
}

export interface CompanyConstructionQueueItem {
  queueItemId: string;
  cityId: string;
  facilityId: string;
  tier: number;
  monthsRemaining: number;
}

export interface CompanyMonthlyCashflow {
  monthFrom: number;
  monthTo: number;
  grossIncome: number;
  income: number;
  opex: number;
  fuel: number;
  loanPaid: number;
  netCashflow: number;
  settleResult: SettlementReport["result"];
}

export interface CompanyLoanActionOutput {
  before: CompanySnapshot;
  after: CompanySnapshot;
  result: SimResult<{ state: GameState }>;
  uiErrorCode: CompanyUiErrorCode | null;
  uiCopy: CompanyUiCopySpec | null;
}

export interface CompanyAdActionOutput {
  before: CompanySnapshot;
  after: CompanySnapshot;
  result: SimResult<{ state: GameState }>;
  uiErrorCode: CompanyUiErrorCode | null;
  uiCopy: CompanyUiCopySpec | null;
}

const DEFAULT_UNLOCK_LEVEL = 1;

function metric(report: SettlementReport, stepId: SettlementStepId, key: string): number {
  const step = report.steps.find((item) => item.stepId === stepId);
  if (!step) return 0;
  return step.metrics[key] ?? 0;
}

function toLoanOption(effectiveLevel: number, tier: LoanTierConfig): CompanyLoanTierOption {
  const unlockLevel = tier.unlock_level ?? DEFAULT_UNLOCK_LEVEL;
  return {
    loanId: tier.loan_id,
    principal: tier.principal,
    terms: tier.terms,
    monthlyPayment: tier.monthly_payment_approx,
    totalInterest: tier.total_interest ?? 0,
    unlockLevel,
    unlocked: effectiveLevel >= unlockLevel
  };
}

function resolveUiCopy(code: CompanyUiErrorCode | null): CompanyUiCopySpec | null {
  if (!code) return null;
  return COMPANY_UI_COPY[code];
}

function mapLoanUiError(
  result: SimResult<{ state: GameState }>,
  snapshot: CompanySnapshot,
  loanId: string
): CompanyUiErrorCode | null {
  if (result.ok) return null;
  if (result.error === "invalid_phase") return "action_invalid";
  if (result.error === "not_found") return "loan_not_found";
  if (result.error === "conflict_in_progress") return "loan_already_active";
  const targetTier = snapshot.loanTierOptions.find((item) => item.loanId === loanId);
  if (targetTier && !targetTier.unlocked) return "loan_tier_locked";
  return "action_failed";
}

function syntheticAdBlockedResult(message: string): SimResult<{ state: GameState }> {
  return {
    ok: false,
    error: "invalid_command_payload",
    message
  };
}

function mapAdUiError(
  adError: AdRewardUiErrorCode | null,
  claimResult: SimResult<{ state: GameState }> | null
): CompanyUiErrorCode | null {
  if (adError === "ad_not_completed") return "ad_not_completed";
  if (adError === "ad_provider_failed") return "ad_provider_failed";
  if (adError === "ad_in_progress") return "ad_in_progress";
  if (adError === "reward_rejected" && claimResult && !claimResult.ok) {
    if (claimResult.error === "conflict_in_progress") return "ads_exhausted";
    if (claimResult.error === "not_found") return "no_active_construction";
    if (claimResult.error === "invalid_phase") return "action_invalid";
    if (claimResult.error === "invalid_command_payload") return "action_invalid";
  }
  return "action_failed";
}

export class ScreenCompany {
  private readonly adRewardService: AdRewardService;

  constructor(controller: RunController, adProvider?: RewardedAdProvider) {
    this.controller = controller;
    this.adRewardService = adProvider
      ? createAdRewardService(controller, adProvider)
      : createDefaultAdRewardService(controller);
  }

  private readonly controller: RunController;

  getSnapshot(): CompanySnapshot {
    const state = this.controller.state;
    const activeLoan = Object.values(state.loans)[0] ?? null;
    const loanTierLevelBonus = getLoanTierLevelBonus(state, this.controller.config);
    const effectiveLoanLevel = state.companyLevel + loanTierLevelBonus;
    const loanTierOptions = this.controller.config.bundle.loanTiers.map((tier) =>
      toLoanOption(effectiveLoanLevel, tier)
    );
    return {
      month: state.currentMonth,
      funds: state.funds,
      companyLevel: state.companyLevel,
      effectiveLoanLevel,
      loanTierLevelBonus,
      socialValue: state.socialValueCurrent,
      gridRegionalLit: state.litTechIds.includes("grid_regional"),
      runResult: state.runResult,
      adsRemaining: state.adsRemaining,
      activeLoan: activeLoan
        ? {
            loanId: activeLoan.loanId,
            principalRemaining: activeLoan.principalRemaining,
            monthlyPayment: activeLoan.monthlyPayment,
            monthsRemaining: activeLoan.monthsRemaining
          }
        : null,
      loanTierOptions,
      canApplyLoan: activeLoan === null,
      activeConstruction: state.constructionQueue.map((item) => ({
        queueItemId: item.id,
        cityId: item.cityId,
        facilityId: item.facilityId,
        tier: item.tier,
        monthsRemaining: item.monthsRemaining
      })),
      growth: buildCompanyGrowthSnapshot(state, this.controller.config)
    };
  }

  getRecentCashflows(limit = 6): CompanyMonthlyCashflow[] {
    const reports = this.controller.getRecentSettlementReports(limit);
    return reports.map((report) => {
      const grossIncome = metric(report, "M5_income_settlement", "gross_income");
      const income = metric(report, "M5_income_settlement", "income");
      const opex = metric(report, "M6_opex_settlement", "opex");
      const fuel = metric(report, "M7_fuel_settlement", "fuel");
      const loanPaid = metric(report, "M8_loan_settlement", "loan_paid");
      return {
        monthFrom: report.monthFrom,
        monthTo: report.monthTo,
        grossIncome,
        income,
        opex,
        fuel,
        loanPaid,
        netCashflow: income - opex - fuel - loanPaid,
        settleResult: report.result
      };
    });
  }

  applyLoan(loanId: string): CompanyLoanActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "apply_loan", loanId });
    const after = this.getSnapshot();
    const uiErrorCode = mapLoanUiError(result, before, loanId);
    return {
      before,
      after,
      result,
      uiErrorCode,
      uiCopy: resolveUiCopy(uiErrorCode)
    };
  }

  private toCashAdActionOutput(
    before: CompanySnapshot,
    adAction: ReturnType<AdRewardService["claimRewardByAd"]>
  ): CompanyAdActionOutput {
    const after = this.getSnapshot();
    if (!adAction.rewarded) {
      const uiErrorCode = mapAdUiError(adAction.uiErrorCode, adAction.claimResult);
      const result =
        adAction.claimResult ??
        syntheticAdBlockedResult(adAction.adOutcome.message ?? "ad reward blocked");
      return {
        before,
        after,
        result,
        uiErrorCode,
        uiCopy: resolveUiCopy(uiErrorCode)
      };
    }
    const result = adAction.claimResult!;
    return {
      before,
      after,
      result,
      uiErrorCode: null,
      uiCopy: null
    };
  }

  private toAdActionOutput(
    before: CompanySnapshot,
    adAction: ReturnType<AdRewardService["claimRewardByAd"]>
  ): CompanyAdActionOutput {
    const after = this.getSnapshot();
    if (!adAction.rewarded) {
      const uiErrorCode = mapAdUiError(adAction.uiErrorCode, adAction.claimResult);
      const result =
        adAction.claimResult ??
        syntheticAdBlockedResult(adAction.adOutcome.message ?? "ad reward blocked");
      return {
        before,
        after,
        result,
        uiErrorCode,
        uiCopy: resolveUiCopy(uiErrorCode)
      };
    }
    const result = adAction.claimResult!;
    return {
      before,
      after,
      result,
      uiErrorCode: null,
      uiCopy: null
    };
  }

  claimCashByAd(): CompanyAdActionOutput {
    const before = this.getSnapshot();
    const adAction = this.adRewardService.claimRewardByAd("cash", "screen_company.cash");
    return this.toCashAdActionOutput(before, adAction);
  }

  async claimCashByAdAsync(): Promise<CompanyAdActionOutput> {
    const before = this.getSnapshot();
    const adAction = await this.adRewardService.claimRewardByAdAsync("cash", "screen_company.cash");
    return this.toCashAdActionOutput(before, adAction);
  }

  speedupConstructionByAd(queueItemId: string): CompanyAdActionOutput {
    const before = this.getSnapshot();
    if (!before.activeConstruction.some((item) => item.queueItemId === queueItemId)) {
      const uiErrorCode: CompanyUiErrorCode = "no_active_construction";
      return {
        before,
        after: before,
        result: syntheticAdBlockedResult("no active construction target"),
        uiErrorCode,
        uiCopy: resolveUiCopy(uiErrorCode)
      };
    }
    const adAction = this.adRewardService.claimRewardByAd(
      "instant_build",
      "screen_company.instant_build",
      queueItemId
    );
    return this.toAdActionOutput(before, adAction);
  }

  async speedupConstructionByAdAsync(queueItemId: string): Promise<CompanyAdActionOutput> {
    const before = this.getSnapshot();
    if (!before.activeConstruction.some((item) => item.queueItemId === queueItemId)) {
      const uiErrorCode: CompanyUiErrorCode = "no_active_construction";
      return {
        before,
        after: before,
        result: syntheticAdBlockedResult("no active construction target"),
        uiErrorCode,
        uiCopy: resolveUiCopy(uiErrorCode)
      };
    }
    const adAction = await this.adRewardService.claimRewardByAdAsync(
      "instant_build",
      "screen_company.instant_build",
      queueItemId
    );
    return this.toAdActionOutput(before, adAction);
  }
}

export function createScreenCompany(
  controller: RunController,
  adProvider?: RewardedAdProvider
): ScreenCompany {
  return new ScreenCompany(controller, adProvider);
}
