import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  StubRewardedAdProvider,
  type RewardedAdOutcome,
  type RewardedAdProvider,
  type RewardedAdRequest
} from "../../src/infra/monetization/rewardedAdProvider.js";
import { RunController } from "../../src/modules/runController.js";
import { createScreenCompany } from "../../src/modules/screenCompany.js";

class AsyncOnlyRewardedAdProvider implements RewardedAdProvider {
  showRewardedAd(_request: RewardedAdRequest): RewardedAdOutcome {
    return {
      status: "failed",
      provider: "stub",
      providerCode: "sync_not_supported",
      message: "sync path should not be used"
    };
  }

  showRewardedAdAsync(_request: RewardedAdRequest): Promise<RewardedAdOutcome> {
    return Promise.resolve({ status: "completed", provider: "stub", providerCode: "async_only" });
  }
}

describe("ScreenCompany", () => {
  it("returns company snapshot with unlocked loan options", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(controller);
    const snapshot = screen.getSnapshot();
    expect(snapshot.month).toBe(1);
    expect(snapshot.companyLevel).toBe(1);
    expect(snapshot.effectiveLoanLevel).toBe(1);
    expect(snapshot.loanTierLevelBonus).toBe(0);
    expect(snapshot.activeLoan).toBeNull();
    expect(snapshot.canApplyLoan).toBe(true);
    const loan1 = snapshot.loanTierOptions.find((item) => item.loanId === "loan_1");
    const loan2 = snapshot.loanTierOptions.find((item) => item.loanId === "loan_2");
    expect(loan1?.unlocked).toBe(true);
    expect(loan2?.unlocked).toBe(false);
  });

  it("supports single active loan and maps loan_already_active", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(controller);
    const first = screen.applyLoan("loan_1");
    expect(first.result.ok).toBe(true);
    expect(first.uiErrorCode).toBeNull();
    expect(first.after.activeLoan?.loanId).toBe("loan_1");

    const second = screen.applyLoan("loan_1");
    expect(second.result.ok).toBe(false);
    expect(second.uiErrorCode).toBe("loan_already_active");
    expect(second.uiCopy).toEqual({
      messageKey: "company.error.loan_already_active",
      actionKey: "company.action.wait_or_repay"
    });
  });

  it("blocks applying a locked higher-tier loan before company level requirement", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(controller);

    const out = screen.applyLoan("loan_3");
    expect(out.result.ok).toBe(false);
    expect(out.uiErrorCode).toBe("loan_tier_locked");
    expect(out.uiCopy).toEqual({
      messageKey: "company.error.loan_tier_locked",
      actionKey: "company.action.level_up_first"
    });
    expect(out.after.activeLoan).toBeNull();
  });

  it("unlocks one higher loan tier after eng_cashflow is lit", () => {
    const controller = createTestController(repoRoot);
    controller.state.companyLevel = 4;
    controller.state.litTechIds.push("eng_cashflow");
    const screen = createScreenCompany(controller);

    const snapshot = screen.getSnapshot();
    expect(snapshot.effectiveLoanLevel).toBe(5);
    expect(snapshot.loanTierLevelBonus).toBe(1);

    const loan5 = snapshot.loanTierOptions.find((item) => item.loanId === "loan_5");
    expect(loan5?.unlocked).toBe(true);

    const out = screen.applyLoan("loan_5");
    expect(out.result.ok).toBe(true);
    expect(out.after.activeLoan?.loanId).toBe("loan_5");
  });

  it("returns recent monthly cashflows from settlement reports", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(controller);
    const out = controller.advanceMonths(2);
    expect(out.failed).toBeNull();
    const cashflows = screen.getRecentCashflows(6);
    expect(cashflows).toHaveLength(2);
    expect(cashflows[0].monthFrom).toBe(1);
    expect(cashflows[0].monthTo).toBe(2);
    expect(cashflows[0].grossIncome).toBeGreaterThanOrEqual(0);
    expect(cashflows[0].netCashflow).toBe(
      cashflows[0].income - cashflows[0].opex - cashflows[0].fuel - cashflows[0].loanPaid
    );
  });

  it("claims cash reward through ad provider by default", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(controller);
    const out = screen.claimCashByAd();
    expect(out.result.ok).toBe(true);
    expect(out.uiErrorCode).toBeNull();
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
    expect(out.after.funds).toBeGreaterThan(out.before.funds);
  });

  it("claims cash reward through async ad provider", async () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(controller, new AsyncOnlyRewardedAdProvider());
    const out = await screen.claimCashByAdAsync();
    expect(out.result.ok).toBe(true);
    expect(out.uiErrorCode).toBeNull();
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
    expect(out.after.funds).toBeGreaterThan(out.before.funds);
  });

  it("maps cancelled ad playback without consuming ads", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(
      controller,
      new StubRewardedAdProvider({ kind: "always_cancel" })
    );
    const out = screen.claimCashByAd();
    expect(out.result.ok).toBe(false);
    expect(out.uiErrorCode).toBe("ad_not_completed");
    expect(out.uiCopy).toEqual({
      messageKey: "company.error.ad_not_completed",
      actionKey: "company.action.retry_ad"
    });
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining);
    expect(out.after.funds).toBe(out.before.funds);
  });

  it("speeds up selected construction through async ad provider", async () => {
    const controller = createTestController(repoRoot);
    const queued = controller.runCommand({
      type: "queue_construction",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1
    });
    expect(queued.ok).toBe(true);
    const target = controller.state.constructionQueue[0];
    const screen = createScreenCompany(controller, new AsyncOnlyRewardedAdProvider());

    const out = await screen.speedupConstructionByAdAsync(target.id);

    expect(out.result.ok).toBe(true);
    expect(out.uiErrorCode).toBeNull();
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
    expect(out.after.activeConstruction).toHaveLength(0);
    expect(Object.values(controller.state.facilities).some((item) => item.facilityId === "wind")).toBe(true);
  });

  it("does not play construction ad without an active target", async () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCompany(controller, new AsyncOnlyRewardedAdProvider());

    const out = await screen.speedupConstructionByAdAsync("missing");

    expect(out.result.ok).toBe(false);
    expect(out.uiErrorCode).toBe("no_active_construction");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining);
  });
});
