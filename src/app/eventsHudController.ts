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
