import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenCompany } from "../../src/app/screenNavController.js";
import {
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd
} from "../../src/app/companyHudController.js";

describe("companyHudController", () => {
  it("applies first unlocked loan on company screen", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    const out = companyApplyFirstUnlockedLoan(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.screens.company.getSnapshot().activeLoan?.loanId).toBe("loan_1");
  });

  it("claims cash via ad stub", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    const before = boot.app.controller.state.funds;
    const out = companyClaimCashByAd(boot);
    expect(out.ok).toBe(true);
    expect(boot.app.controller.state.funds).toBeGreaterThan(before);
  });
});
