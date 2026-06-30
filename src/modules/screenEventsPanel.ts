import type { RunController } from "./runController.js";

export type EventLifecycle = "upcoming" | "active" | "expired";

export interface UpcomingDisasterEntry {
  lifecycle: "upcoming";
  seq: number;
  eventId: string;
  triggerMonth: number;
  monthsUntilTrigger: number;
  examTier: number;
  isFinal: boolean;
  immediateCashPenalty: number;
  adjustedCashPenalty: number;
  cashPenaltyReduced: boolean;
  popupRequired: boolean;
}

export interface ActiveDisasterEntry {
  lifecycle: "active";
  seq: number;
  eventId: string;
  triggerMonth: number;
  examTier: number;
  monthsRemaining: number;
  isFinal: boolean;
  incomeMultNum: number;
  incomeMultDen: number;
  buildDurationMultNum: number;
  buildDurationMultDen: number;
  researchDurationMultNum: number;
  researchDurationMultDen: number;
  needsAcknowledgement: boolean;
}

export interface ExpiredDisasterEntry {
  lifecycle: "expired";
  seq: number;
  eventId: string;
  triggerMonth: number;
  isFinal: boolean;
}

export type EventEntry =
  | UpcomingDisasterEntry
  | ActiveDisasterEntry
  | ExpiredDisasterEntry;

export interface EventsPanelSnapshot {
  month: number;
  activeCount: number;
  activeSlotLimit: number;
  activeOverflowCount: number;
  visibleActive: ActiveDisasterEntry[];
  hiddenActive: ActiveDisasterEntry[];
  upcoming: UpcomingDisasterEntry[];
  active: ActiveDisasterEntry[];
  expired: ExpiredDisasterEntry[];
  pendingFullscreenQueue: ActiveDisasterEntry[];
  pendingFullscreen: ActiveDisasterEntry | null;
}

export interface EventModalCopySpec {
  titleKey: string;
  summaryKey: string;
  impactKey: string;
  acknowledgeButtonKey: string;
}

export interface PendingFullscreenModal {
  entry: ActiveDisasterEntry;
  copy: EventModalCopySpec;
}

export type EventsPanelUiErrorCode =
  | "event_not_found"
  | "event_not_active"
  | "no_pending_modal"
  | "action_failed";

export interface EventsPanelUiCopySpec {
  messageKey: string;
  actionKey: string;
}

export const EVENTS_PANEL_UI_COPY: Record<EventsPanelUiErrorCode, EventsPanelUiCopySpec> = {
  event_not_found: {
    messageKey: "events_panel.error.event_not_found",
    actionKey: "events_panel.action.refresh_list"
  },
  event_not_active: {
    messageKey: "events_panel.error.event_not_active",
    actionKey: "events_panel.action.refresh_list"
  },
  no_pending_modal: {
    messageKey: "events_panel.error.no_pending_modal",
    actionKey: "events_panel.action.close_panel"
  },
  action_failed: {
    messageKey: "events_panel.error.action_failed",
    actionKey: "events_panel.action.retry"
  }
};

export interface EventsPanelActionOutput {
  ok: boolean;
  uiErrorCode: EventsPanelUiErrorCode | null;
  uiCopy: EventsPanelUiCopySpec | null;
  before: EventsPanelSnapshot;
  after: EventsPanelSnapshot;
}

export const ACTIVE_SLOT_LIMIT = 3;

function getAdjustedDisasterPenalty(controller: RunController, basePenalty: number): number {
  const percentDelta = controller.state.litTechIds.reduce((sum, techId) => {
    const tech = controller.config.getTechnology(techId);
    if (tech?.effect_type !== "modifier") return sum;
    const value = tech.effect_value.disaster_cash_pct;
    return typeof value === "number" && Number.isFinite(value) ? sum + value : sum;
  }, 0);
  return Math.max(0, Math.floor((basePenalty * (100 + percentDelta)) / 100));
}

function resolveUiCopy(
  code: EventsPanelUiErrorCode | null
): EventsPanelUiCopySpec | null {
  if (!code) return null;
  return EVENTS_PANEL_UI_COPY[code];
}

function buildEventModalCopy(eventId: string, isFinal: boolean): EventModalCopySpec {
  return {
    titleKey: `events.modal.${eventId}.title`,
    summaryKey: `events.modal.${eventId}.summary`,
    impactKey: `events.modal.${eventId}.impact`,
    acknowledgeButtonKey: isFinal
      ? "events.modal.action.acknowledge_final"
      : "events.modal.action.acknowledge"
  };
}

function compareActivePriority(a: ActiveDisasterEntry, b: ActiveDisasterEntry): number {
  if (a.isFinal !== b.isFinal) return a.isFinal ? -1 : 1;
  if (a.examTier !== b.examTier) return b.examTier - a.examTier;
  if (a.triggerMonth !== b.triggerMonth) return a.triggerMonth - b.triggerMonth;
  return a.seq - b.seq;
}

export class ScreenEventsPanel {
  constructor(private readonly controller: RunController) {}

  getSnapshot(): EventsPanelSnapshot {
    const state = this.controller.state;
    const month = state.currentMonth;
    const disasters = this.controller.config.bundle.disasters;
    const difficulty = this.controller.config.bundle.difficulties.find(
      (item) => item.difficulty_id === state.difficultyId
    );
    const disasterCashMult = difficulty?.disaster_cash_mult ?? 1;

    const upcoming: UpcomingDisasterEntry[] = [];
    const active: ActiveDisasterEntry[] = [];
    const expired: ExpiredDisasterEntry[] = [];

    for (const disaster of disasters) {
      const isTriggered = state.disastersTriggered.includes(disaster.seq);
      const activeDebuff = state.activeDebuffs.find(
        (d) => d.disasterSeq === disaster.seq
      );
      if (!isTriggered && disaster.trigger_month >= month) {
        const baseCashPenalty = Math.floor(disaster.immediate_cash_penalty * disasterCashMult);
        const adjustedCashPenalty = getAdjustedDisasterPenalty(this.controller, baseCashPenalty);
        upcoming.push({
          lifecycle: "upcoming",
          seq: disaster.seq,
          eventId: disaster.event_id ?? `disaster_${disaster.seq}`,
          triggerMonth: disaster.trigger_month,
          monthsUntilTrigger: disaster.trigger_month - month,
          examTier: disaster.exam_tier,
          isFinal: disaster.is_final ?? false,
          immediateCashPenalty: baseCashPenalty,
          adjustedCashPenalty,
          cashPenaltyReduced: adjustedCashPenalty < baseCashPenalty,
          popupRequired: disaster.popup_required ?? true
        });
        continue;
      }
      if (activeDebuff) {
        active.push({
          lifecycle: "active",
          seq: disaster.seq,
          eventId: disaster.event_id ?? `disaster_${disaster.seq}`,
          triggerMonth: disaster.trigger_month,
          examTier: disaster.exam_tier,
          monthsRemaining: activeDebuff.monthsRemaining,
          isFinal: disaster.is_final ?? false,
          incomeMultNum: activeDebuff.incomeMultNum,
          incomeMultDen: activeDebuff.incomeMultDen,
          buildDurationMultNum: activeDebuff.buildDurationMultNum,
          buildDurationMultDen: activeDebuff.buildDurationMultDen,
          researchDurationMultNum: activeDebuff.researchDurationMultNum,
          researchDurationMultDen: activeDebuff.researchDurationMultDen,
          needsAcknowledgement:
            (disaster.popup_required ?? true) &&
            !state.acknowledgedDisasterSeqs.includes(disaster.seq)
        });
        continue;
      }
      if (isTriggered) {
        expired.push({
          lifecycle: "expired",
          seq: disaster.seq,
          eventId: disaster.event_id ?? `disaster_${disaster.seq}`,
          triggerMonth: disaster.trigger_month,
          isFinal: disaster.is_final ?? false
        });
      }
    }

    upcoming.sort((a, b) => a.monthsUntilTrigger - b.monthsUntilTrigger);
    active.sort(compareActivePriority);
    expired.sort((a, b) => a.triggerMonth - b.triggerMonth);

    const pendingFullscreenQueue = active.filter((entry) => entry.needsAcknowledgement);
    const pendingFullscreen = pendingFullscreenQueue[0] ?? null;
    const visibleActive = active.slice(0, ACTIVE_SLOT_LIMIT);
    const hiddenActive = active.slice(ACTIVE_SLOT_LIMIT);

    return {
      month,
      activeCount: active.length,
      activeSlotLimit: ACTIVE_SLOT_LIMIT,
      activeOverflowCount: hiddenActive.length,
      visibleActive,
      hiddenActive,
      upcoming,
      active,
      expired,
      pendingFullscreenQueue,
      pendingFullscreen
    };
  }

  acknowledgeFullscreen(seq: number): EventsPanelActionOutput {
    const before = this.getSnapshot();
    const disaster = this.controller.config.bundle.disasters.find(
      (d) => d.seq === seq
    );
    if (!disaster) {
      return {
        ok: false,
        uiErrorCode: "event_not_found",
        uiCopy: resolveUiCopy("event_not_found"),
        before,
        after: before
      };
    }
    const active = before.active.find((entry) => entry.seq === seq);
    if (!active) {
      return {
        ok: false,
        uiErrorCode: "event_not_active",
        uiCopy: resolveUiCopy("event_not_active"),
        before,
        after: before
      };
    }
    if (!active.needsAcknowledgement) {
      return {
        ok: false,
        uiErrorCode: "no_pending_modal",
        uiCopy: resolveUiCopy("no_pending_modal"),
        before,
        after: before
      };
    }
    if (!this.controller.state.acknowledgedDisasterSeqs.includes(seq)) {
      this.controller.state.acknowledgedDisasterSeqs.push(seq);
    }
    const after = this.getSnapshot();
    return {
      ok: true,
      uiErrorCode: null,
      uiCopy: null,
      before,
      after
    };
  }

  acknowledgeNextPending(): EventsPanelActionOutput {
    const before = this.getSnapshot();
    const next = before.pendingFullscreen;
    if (!next) {
      return {
        ok: false,
        uiErrorCode: "no_pending_modal",
        uiCopy: resolveUiCopy("no_pending_modal"),
        before,
        after: before
      };
    }
    return this.acknowledgeFullscreen(next.seq);
  }

  getEventModalCopyBySeq(seq: number): EventModalCopySpec | null {
    const disaster = this.controller.config.bundle.disasters.find((item) => item.seq === seq);
    if (!disaster) return null;
    return buildEventModalCopy(
      disaster.event_id ?? `disaster_${disaster.seq}`,
      disaster.is_final ?? false
    );
  }

  getPendingFullscreenModal(): PendingFullscreenModal | null {
    const snapshot = this.getSnapshot();
    if (!snapshot.pendingFullscreen) return null;
    const copy = this.getEventModalCopyBySeq(snapshot.pendingFullscreen.seq);
    if (!copy) return null;
    return { entry: snapshot.pendingFullscreen, copy };
  }
}

export function createScreenEventsPanel(controller: RunController): ScreenEventsPanel {
  return new ScreenEventsPanel(controller);
}
