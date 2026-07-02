import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenCompany } from "../../src/app/screenNavController.js";
import {
  companyApplySelectedLoan,
  companyCycleLoanCandidate,
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd,
  formatCompanyCashflowOpportunityLine,
  formatCompanyConstructionOpportunityLine,
  formatCompanyConstructionTechLine,
  formatCompanyEcoOpportunityLine,
  formatCompanyEcoTechLine,
  formatCompanyGenerationOpportunityLine,
  formatCompanyGenerationTechLine,
  formatCompanyGreenBrandOpportunityLine,
  formatCompanyGridDispatchOpportunityLine,
  formatCompanyGridDispatchTechLine,
  formatCompanyGridOpportunityLine,
  formatCompanyGridTechLine,
  formatCompanyLoanTierBonusLine,
  formatCompanyNuclearOpportunityLine,
  formatCompanyNuclearTechLine,
  formatCompanyOpexOpportunityLine,
  formatCompanyOpexTechLine,
  formatCompanyStorageOpportunityLine,
  formatCompanyStorageTechLine,
  formatCompanyStrategicOpportunityLine,
  formatCompanyStrategicTechLine,
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

  it("formats cashflow opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 4;

    expect(formatCompanyCashflowOpportunityLine(boot)).toBe(
      "现金流机会：研发后贷款等级+1 · 有效5级"
    );

    boot.app.controller.state.litTechIds.push("eng_cashflow");
    expect(formatCompanyCashflowOpportunityLine(boot)).toBeNull();
  });

  it("formats construction tech build cost reduction", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_bulk_procure");

    expect(formatCompanyConstructionTechLine(boot)).toBe("建设科技：建设费-8%");
  });

  it("formats construction opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 2;

    expect(formatCompanyConstructionOpportunityLine(boot)).toBe(
      "建设机会：研发后建设费-8%"
    );

    boot.app.controller.state.litTechIds.push("eng_bulk_procure");
    expect(formatCompanyConstructionOpportunityLine(boot)).toBeNull();
  });

  it("formats opex tech reductions", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_ops_contract", "nuclear_ops");

    expect(formatCompanyOpexTechLine(boot)).toBe("运维科技：通用运维-10%/核电运维-18%");
  });

  it("formats opex opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;

    expect(formatCompanyOpexOpportunityLine(boot)).toBe(
      "运维机会：研发后通用运维-10%"
    );

    boot.app.controller.state.litTechIds.push("eng_ops_contract");
    expect(formatCompanyOpexOpportunityLine(boot)).toBeNull();
  });

  it("formats nuclear opex opportunity when its prerequisite is lit", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("eng_ops_contract", "nuclear_2");

    expect(formatCompanyOpexOpportunityLine(boot)).toBe(
      "运维机会：研发后核电运维-18%"
    );
  });

  it("formats generation tier tech branches", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push(
      "wind_3",
      "solar_4",
      "thermal_5",
      "hydro_5",
      "nuclear_3"
    );

    expect(formatCompanyGenerationTechLine(boot)).toBe("发电科技：风·3/光·4/火·5/水·5");
  });

  it("formats generation tier opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    boot.app.controller.state.litTechIds.push(
      "wind_2",
      "solar_2",
      "thermal_2",
      "hydro_2",
      "storage_system_1"
    );

    expect(formatCompanyGenerationOpportunityLine(boot)).toBe(
      "发电机会：研发后风·3/光·3/火·3/水·3"
    );
  });

  it("formats next generation tier opportunity when prerequisites are lit", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push(
      "wind_2",
      "wind_3",
      "wind_4",
      "storage_system_1",
      "storage_system_2",
      "storage_system_3"
    );

    expect(formatCompanyGenerationOpportunityLine(boot)).toBe(
      "发电机会：研发后风·5"
    );
  });

  it("formats nuclear build tier tech", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("nuclear_1", "nuclear_2", "nuclear_3");

    expect(formatCompanyNuclearTechLine(boot)).toBe("核电科技：可建核电·3");
  });

  it("formats nuclear opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;

    expect(formatCompanyNuclearOpportunityLine(boot)).toBe(
      "核电机会：研发后可建核电·1"
    );
  });

  it("formats next nuclear tier opportunity when prerequisite is lit", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("nuclear_1", "nuclear_2");

    expect(formatCompanyNuclearOpportunityLine(boot)).toBe(
      "核电机会：研发后可建核电·3"
    );
  });

  it("formats storage tech branches", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push(
      "storage_system_1",
      "storage_system_2",
      "storage_system_3"
    );

    expect(formatCompanyStorageTechLine(boot)).toBe("储能科技：风光水储能x2/风光水可研·3/4/5");
  });

  it("formats storage opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;

    expect(formatCompanyStorageOpportunityLine(boot)).toBe(
      "储能机会：研发后风光水储能x2/风光水可研·3"
    );
  });

  it("formats next storage gate opportunity when prerequisite is lit", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("storage_system_1", "storage_system_2");

    expect(formatCompanyStorageOpportunityLine(boot)).toBe(
      "储能机会：研发后风光水可研·5"
    );
  });

  it("formats grid dispatch loss reduction", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_grid_dispatch");

    expect(formatCompanyGridDispatchTechLine(boot)).toBe("调度科技：区域线损-10%");
  });

  it("formats grid dispatch opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;

    expect(formatCompanyGridDispatchOpportunityLine(boot)).toBe(
      "调度机会：研发后区域线损-10%"
    );

    boot.app.controller.state.litTechIds.push("eng_grid_dispatch");
    expect(formatCompanyGridDispatchOpportunityLine(boot)).toBeNull();
  });

  it("formats grid tech branches", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("grid_regional", "grid_backbone", "uhv_transmission");

    expect(formatCompanyGridTechLine(boot)).toBe(
      "电网科技：区域线造价-25%/主干造价-25%/主干线损特高压档"
    );
  });

  it("formats eco tech branches", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eco_thermal", "eco_nuclear", "eng_green_pr");

    expect(formatCompanyEcoTechLine(boot)).toBe(
      "生态科技：火电ECO/核电ECO/全环保城SV+5%"
    );
  });

  it("formats eco opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 4;

    expect(formatCompanyEcoOpportunityLine(boot)).toBe(
      "生态机会：研发后火电ECO/核电ECO"
    );
  });

  it("formats remaining eco opportunity after one sync is lit", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 4;
    boot.app.controller.state.litTechIds.push("eco_thermal");

    expect(formatCompanyEcoOpportunityLine(boot)).toBe(
      "生态机会：研发后核电ECO"
    );
  });

  it("formats grid opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;

    expect(formatCompanyGridOpportunityLine(boot)).toBe(
      "电网机会：研发后区域线造价-25%"
    );
  });

  it("formats UHV opportunity when backbone prerequisite is lit", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("grid_regional", "grid_backbone");

    expect(formatCompanyGridOpportunityLine(boot)).toBe(
      "电网机会：研发后主干线损特高压档"
    );
  });

  it("formats level-V green brand opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.cities["CITY-START"].cityFullyEcoSupply = true;

    expect(formatCompanyGreenBrandOpportunityLine(boot)).toBe(
      "绿色品牌机会：全环保城1座 · 研发后SV+5%"
    );

    boot.app.controller.state.litTechIds.push("eng_green_pr");
    expect(formatCompanyGreenBrandOpportunityLine(boot)).toBeNull();
  });

  it("formats strategic tech branches", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("super_hydro");

    expect(formatCompanyStrategicTechLine(boot)).toBe("战略科技：超级水电槽+2");
  });

  it("formats strategic opportunity before research", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;

    expect(formatCompanyStrategicOpportunityLine(boot)).toBe(
      "战略机会：研发后超级水电槽+2"
    );

    boot.app.controller.state.litTechIds.push("super_hydro");
    expect(formatCompanyStrategicOpportunityLine(boot)).toBeNull();
  });
});
