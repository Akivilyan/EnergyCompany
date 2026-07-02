import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import { t } from "../i18n/index.js";

export interface EventsHudActionResult {
  ok: boolean;
  view: ReturnType<typeof readCityHudViewModel>;
  uiErrorCode: string | null;
  messageKey: string | null;
}

function toActionResult(
  boot: GameBootstrap,
  ok: boolean,
  uiErrorCode: string | null,
  messageKey: string | null
): EventsHudActionResult {
  return {
    ok,
    view: readCityHudViewModel(boot),
    uiErrorCode,
    messageKey
  };
}

/** 确认队列中下一个待全屏确认的灾害（开发 HUD）。 */
export function eventsAcknowledgeNextPending(boot: GameBootstrap): EventsHudActionResult {
  const out = boot.app.screens.events.acknowledgeNextPending();
  return toActionResult(
    boot,
    out.ok,
    out.uiErrorCode,
    out.uiCopy?.messageKey ?? null
  );
}

export function formatPendingEventModalLines(
  boot: GameBootstrap
): { title: string; summary: string; impact: string; ackKey: string } | null {
  const modal = boot.app.screens.events.getPendingFullscreenModal();
  if (!modal) return null;
  const { copy } = modal;
  return {
    title: t(copy.titleKey),
    summary: t(copy.summaryKey),
    impact: t(copy.impactKey),
    ackKey: copy.acknowledgeButtonKey
  };
}

/** 城市屏副标题：待确认弹窗 / 进行中 / 下一场预告。 */
export function formatEventsHudHint(boot: GameBootstrap): string | null {
  const pending = formatPendingEventModalLines(boot);
  if (pending) {
    return t("hud.events.pending", { title: pending.title });
  }
  const snap = boot.app.screens.events.getSnapshot();
  if (snap.active.length > 0) {
    return t("hud.events.active", { count: snap.active.length });
  }
  const next = snap.upcoming[0];
  if (next) {
    return t("hud.events.upcoming", {
      months: next.monthsUntilTrigger,
      id: next.eventId
    });
  }
  return null;
}

function formatPercent(num: number, den: number): number {
  return Math.round((num / den) * 100);
}

export function formatActiveEventPressureLine(boot: GameBootstrap): string | null {
  const active = boot.app.screens.events.getSnapshot().active[0];
  if (!active) return null;
  return t("hud.events.active_pressure", {
    months: active.monthsRemaining,
    income: formatPercent(active.incomeMultNum, active.incomeMultDen),
    build: formatPercent(active.buildDurationMultNum, active.buildDurationMultDen),
    research: formatPercent(active.researchDurationMultNum, active.researchDurationMultDen)
  });
}

export function formatUpcomingEventRiskLine(boot: GameBootstrap): string | null {
  const next = boot.app.screens.events.getSnapshot().upcoming[0];
  if (!next || !next.cashPenaltyReduced) return null;
  return t("hud.events.upcoming_risk", {
    month: next.triggerMonth,
    adjusted: next.adjustedCashPenalty,
    base: next.immediateCashPenalty
  });
}

export function formatUpcomingEventRiskOpportunityLine(boot: GameBootstrap): string | null {
  const next = boot.app.screens.events.getSnapshot().upcoming[0];
  if (!next || next.cashPenaltyReduced) return null;
  if (boot.app.controller.state.litTechIds.includes("eng_risk_reserve")) return null;
  const tech = boot.app.controller.config.getTechnology("eng_risk_reserve");
  if (!tech || boot.app.controller.state.companyLevel < tech.company_level_min) return null;
  const percentDelta = tech.effect_value.disaster_cash_pct;
  if (typeof percentDelta !== "number" || !Number.isFinite(percentDelta) || percentDelta >= 0) {
    return null;
  }
  const adjusted = Math.max(0, Math.floor((next.immediateCashPenalty * (100 + percentDelta)) / 100));
  if (adjusted >= next.immediateCashPenalty) return null;
  return t("hud.events.upcoming_risk_opportunity", {
    month: next.triggerMonth,
    adjusted,
    base: next.immediateCashPenalty
  });
}
