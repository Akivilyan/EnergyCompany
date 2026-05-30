import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { StubRewardedAdProvider } from "../../src/infra/monetization/rewardedAdProvider.js";
import { RunController } from "../../src/modules/runController.js";
import { createScreenCompany } from "../../src/modules/screenCompany.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("ScreenCompany", () => {
  it("returns company snapshot with unlocked loan options", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenCompany(controller);
    const snapshot = screen.getSnapshot();
    expect(snapshot.month).toBe(1);
    expect(snapshot.companyLevel).toBe(1);
    expect(snapshot.activeLoan).toBeNull();
    expect(snapshot.canApplyLoan).toBe(true);
    const loan1 = snapshot.loanTierOptions.find((item) => item.loanId === "loan_1");
    const loan2 = snapshot.loanTierOptions.find((item) => item.loanId === "loan_2");
    expect(loan1?.unlocked).toBe(true);
    expect(loan2?.unlocked).toBe(false);
  });

  it("supports single active loan and maps loan_already_active", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenCompany(controller);
    const first = screen.applyLoan("loan_1");
    expect(first.result.ok).toBe(true);
    expect(first.uiErrorCode).toBeNull();
    expect(first.after.activeLoan?.loanId).toBe("loan_1");

    const second = screen.applyLoan("loan_2");
    expect(second.result.ok).toBe(false);
    expect(second.uiErrorCode).toBe("loan_already_active");
    expect(second.uiCopy).toEqual({
      messageKey: "company.error.loan_already_active",
      actionKey: "company.action.wait_or_repay"
    });
  });

  it("returns recent monthly cashflows from settlement reports", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
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
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenCompany(controller);
    const out = screen.claimCashByAd();
    expect(out.result.ok).toBe(true);
    expect(out.uiErrorCode).toBeNull();
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
    expect(out.after.funds).toBeGreaterThan(out.before.funds);
  });

  it("maps cancelled ad playback without consuming ads", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
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
});
