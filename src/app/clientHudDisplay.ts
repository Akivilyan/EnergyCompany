import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import { formatEventsHudHint, formatPendingEventModalLines } from "./eventsHudController.js";
import { t, tScreenLabel } from "../i18n/index.js";

export function formatLoanTierLabel(loanId: string): string {
  const key = `loan.tier.${loanId}`;
  const label = t(key);
  return label === key ? loanId : label;
}

export interface ClientHudDisplay {
  statusLine: string;
  detailLine: string;
}

function formatCityStatus(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
  return t("hud.status.city", { month: view.month, funds: view.funds, city });
}

function formatCompanyStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.company.getSnapshot();
  const statusLine = t("hud.status.company", {
    level: s.companyLevel,
    funds: s.funds,
    ads: s.adsRemaining
  });
  const loanPart = s.activeLoan
    ? t("hud.status.company_loan_detail", {
        loanName: formatLoanTierLabel(s.activeLoan.loanId),
        months: s.activeLoan.monthsRemaining
      })
    : t("hud.status.company_no_loan");
  return { statusLine, detailLine: loanPart };
}

function formatTechStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.tech.getSnapshot();
  if (!s.canOpen) {
    return {
      statusLine: t("hud.status.tech_locked", { level: s.companyLevel }),
      detailLine: t("hud.status.tech_locked_hint")
    };
  }
  const statusLine = t("hud.status.tech_header", { lit: s.litTechIds.length });
  if (s.activeResearch) {
    return {
      statusLine,
      detailLine: t("hud.status.tech_active_hint", {
        techId: s.activeResearch.techId,
        months: s.activeResearch.monthsRemaining
      })
    };
  }
  return { statusLine, detailLine: t("hud.status.tech_idle_hint") };
}

export function formatNavHint(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const stack = boot.play.getNavigation().stack.length;
  return t("hud.nav.hint", { screen: tScreenLabel(view.screen), stack });
}

/** 主副两行文案，避免单行过长顶出屏幕。 */
export function buildClientHudDisplay(
  boot: GameBootstrap,
  actionMessage: string | null = null
): ClientHudDisplay {
  const screen = boot.play.getNavigation().currentScreen;
  let display: ClientHudDisplay;
  if (screen === "screen_company") {
    display = formatCompanyStatus(boot);
  } else if (screen === "screen_tech_tree") {
    display = formatTechStatus(boot);
  } else {
    const eventsHint = formatEventsHudHint(boot);
    const pending = formatPendingEventModalLines(boot);
    display = {
      statusLine: formatCityStatus(boot),
      detailLine: eventsHint ?? formatNavHint(boot)
    };
    if (pending) {
      display.detailLine = `${display.detailLine} · ${pending.summary}`;
    }
  }

  if (screen === "screen_company" || screen === "screen_tech_tree") {
    const nav = formatNavHint(boot);
    display.detailLine = actionMessage
      ? `${nav} · ${display.detailLine} · ${actionMessage}`
      : `${nav} · ${display.detailLine}`;
  } else if (actionMessage) {
    display.detailLine = `${display.detailLine} · ${actionMessage}`;
  }

  return display;
}
