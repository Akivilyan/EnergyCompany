import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenCompany } from "../../src/app/screenNavController.js";
import {
  companyApplySelectedLoan,
  companyCycleLoanCandidate,
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd,
  formatCompanyLoanTierBonusLine,
  formatSelectedLoanCandidate,
  getCompanyHudSelectionSnapshot
} from "../../src/app/companyHudController.js";

describe("companyHudController", () => {
  it("applies first unlocked loan on company screen", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    const out = companyApplyFirstUnlockedLoan(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.screens.company.getSnapshot().activeLoan?.loanId).toBe("loan_1");
  });

  it("cycles to next unlocked loan candidate after company level up", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 2;
    clientNavOpenCompany(boot);

    expect(getCompanyHudSelectionSnapshot(boot)).toEqual({
      candidates: [
        {
          loanId: "loan_1",
          displayName: "小额贷款（30万）",
          principal: 30,
          terms: 12,
          monthlyPayment: 3
        },
        {
          loanId: "loan_2",
          displayName: "中额贷款（80万）",
          principal: 80,
          terms: 18,
          monthlyPayment: 5
        }
      ],
      selectedLoanId: "loan_1"
    });

    const cycle = companyCycleLoanCandidate(boot);
    expect(cycle.ok).toBe(true);
    expect(cycle.messageKey).toBe("company.action.selected_next_candidate");
    expect(formatSelectedLoanCandidate(boot)).toContain("中额贷款（80万）");

    const out = companyApplySelectedLoan(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.screens.company.getSnapshot().activeLoan?.loanId).toBe("loan_2");
  });

  it("claims cash via ad stub", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    const before = boot.app.controller.state.funds;
    const out = companyClaimCashByAd(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.controller.state.funds).toBeGreaterThan(before);
  });

  it("formats cashflow tech loan tier bonus", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 4;
    boot.app.controller.state.litTechIds.push("eng_cashflow");

    expect(formatCompanyLoanTierBonusLine(boot)).toBe("现金流科技：贷款等级+1 · 有效5级");
  });
});
