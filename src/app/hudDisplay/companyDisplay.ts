import type { GameBootstrap } from "../gameBootstrap.js";
import {
  formatActiveEventPressureLine,
  formatActiveEventRecoveryActionLine,
  formatDisasterAxisProgressLine,
  formatUpcomingEventPrepActionLine,
  formatUpcomingEventRiskLine,
  formatUpcomingEventRiskOpportunityLine
} from "../eventsHudController.js";
import {
  formatCompanyCashflowOpportunityLine,
  formatCompanyConstructionTechLine,
  formatCompanyEcoOpportunityLine,
  formatCompanyEcoTechLine,
  formatCompanyGenerationOpportunityLine,
  formatCompanyGenerationTechLine,
  formatCompanyGridDispatchOpportunityLine,
  formatCompanyGreenBrandOpportunityLine,
  formatCompanyGridDispatchTechLine,
  formatCompanyGridOpportunityLine,
  formatCompanyGridTechLine,
  formatCompanyLevelGoalLine,
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
} from "../companyHudController.js";
import { t } from "../../i18n/index.js";
import type { ClientHudDisplay } from "./types.js";
import { formatLoanTierLabel, hudLines } from "./shared.js";

function nextCompanyLevelThreshold(boot: GameBootstrap, companyLevel: number): number | null {
  const row = boot.app.controller.config.bundle.companyLevels.find(
    (item) => item.level === companyLevel + 1
  );
  return row?.sv_threshold ?? null;
}

function formatLatestCompanyCashflow(boot: GameBootstrap): string | null {
  const latest = boot.app.screens.company.getRecentCashflows(1)[0];
  if (!latest) return null;
  return t("hud.status.company_cashflow", {
    month: latest.monthFrom,
    net: latest.netCashflow,
    income: latest.income,
    opex: latest.opex,
    fuel: latest.fuel,
    loan: latest.loanPaid
  });
}

export function buildCompanyHudDisplay(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.company.getSnapshot();
  const selection = getCompanyHudSelectionSnapshot(boot);
  const selectedLoan = formatSelectedLoanCandidate(boot);
  const latestCashflow = formatLatestCompanyCashflow(boot);
  const nextThreshold = nextCompanyLevelThreshold(boot, s.companyLevel);
  const svLine =
    nextThreshold === null
      ? t("hud.line.social_value_max", { current: s.socialValue })
      : t("hud.line.social_value", { current: s.socialValue, next: nextThreshold });
  const statusLine = t("hud.status.company", {
    level: s.companyLevel,
    funds: s.funds,
    ads: s.adsRemaining
  });
  const statusLines = hudLines(
    t("hud.line.company_header", { level: s.companyLevel }),
    t("hud.line.funds", { funds: s.funds }),
    t("hud.line.ads_remaining", { ads: s.adsRemaining })
  );
  const loanPart = s.activeLoan
    ? t("hud.status.company_loan_detail", {
        loanName: formatLoanTierLabel(s.activeLoan.loanId),
        months: s.activeLoan.monthsRemaining
      })
    : t("hud.status.company_no_loan");
  const detailLines = s.activeLoan
    ? hudLines(
        svLine,
        formatCompanyLevelGoalLine(boot),
        latestCashflow,
        formatDisasterAxisProgressLine(boot),
        formatActiveEventPressureLine(boot),
        formatActiveEventRecoveryActionLine(boot),
        formatUpcomingEventPrepActionLine(boot),
        formatUpcomingEventRiskLine(boot),
        formatUpcomingEventRiskOpportunityLine(boot),
        formatCompanyCashflowOpportunityLine(boot),
        formatCompanyConstructionTechLine(boot),
        formatCompanyOpexTechLine(boot),
        formatCompanyOpexOpportunityLine(boot),
        formatCompanyGenerationTechLine(boot),
        formatCompanyGenerationOpportunityLine(boot),
        formatCompanyNuclearTechLine(boot),
        formatCompanyNuclearOpportunityLine(boot),
        formatCompanyStorageTechLine(boot),
        formatCompanyStorageOpportunityLine(boot),
        formatCompanyGridTechLine(boot),
        formatCompanyGridOpportunityLine(boot),
        formatCompanyGridDispatchTechLine(boot),
        formatCompanyGridDispatchOpportunityLine(boot),
        formatCompanyEcoTechLine(boot),
        formatCompanyEcoOpportunityLine(boot),
        formatCompanyGreenBrandOpportunityLine(boot),
        formatCompanyStrategicTechLine(boot),
        formatCompanyStrategicOpportunityLine(boot),
        loanPart
      )
    : hudLines(
        svLine,
        formatCompanyLevelGoalLine(boot),
        latestCashflow,
        formatDisasterAxisProgressLine(boot),
        formatActiveEventPressureLine(boot),
        formatActiveEventRecoveryActionLine(boot),
        formatUpcomingEventPrepActionLine(boot),
        formatUpcomingEventRiskLine(boot),
        formatUpcomingEventRiskOpportunityLine(boot),
        formatCompanyLoanTierBonusLine(boot),
        formatCompanyCashflowOpportunityLine(boot),
        formatCompanyConstructionTechLine(boot),
        formatCompanyOpexTechLine(boot),
        formatCompanyOpexOpportunityLine(boot),
        formatCompanyGenerationTechLine(boot),
        formatCompanyGenerationOpportunityLine(boot),
        formatCompanyNuclearTechLine(boot),
        formatCompanyNuclearOpportunityLine(boot),
        formatCompanyStorageTechLine(boot),
        formatCompanyStorageOpportunityLine(boot),
        formatCompanyGridTechLine(boot),
        formatCompanyGridOpportunityLine(boot),
        formatCompanyGridDispatchTechLine(boot),
        formatCompanyGridDispatchOpportunityLine(boot),
        formatCompanyEcoTechLine(boot),
        formatCompanyEcoOpportunityLine(boot),
        formatCompanyGreenBrandOpportunityLine(boot),
        formatCompanyStrategicTechLine(boot),
        formatCompanyStrategicOpportunityLine(boot),
        selectedLoan,
        selection.candidates.length > 1
          ? t("hud.status.company_loan_candidate_count", { count: selection.candidates.length })
          : loanPart
      );
  return { statusLine, detailLine: detailLines.join(" · "), statusLines, detailLines };
}
