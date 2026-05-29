import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenEventsPanel } from "../../src/modules/screenEventsPanel.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function settleTo(controller: RunController, targetMonth: number): void {
  while (controller.state.currentMonth < targetMonth && controller.state.runResult === null) {
    const month = controller.runNextMonth();
    if (!month.ok) {
      throw new Error(`settle failed: ${month.error} ${month.message}`);
    }
  }
}

describe("ScreenEventsPanel", () => {
  it("lists all four fixed disasters as upcoming at month 1", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const panel = createScreenEventsPanel(controller);
    const snapshot = panel.getSnapshot();
    expect(snapshot.month).toBe(1);
    expect(snapshot.upcoming.map((e) => e.triggerMonth)).toEqual([22, 41, 63, 86]);
    expect(snapshot.upcoming[0].monthsUntilTrigger).toBe(21);
    expect(snapshot.upcoming[3].isFinal).toBe(true);
    expect(snapshot.active).toHaveLength(0);
    expect(snapshot.visibleActive).toHaveLength(0);
    expect(snapshot.hiddenActive).toHaveLength(0);
    expect(snapshot.activeOverflowCount).toBe(0);
    expect(snapshot.expired).toHaveLength(0);
    expect(snapshot.pendingFullscreenQueue).toHaveLength(0);
    expect(snapshot.pendingFullscreen).toBeNull();
    expect(snapshot.activeSlotLimit).toBe(3);
  });

  it("surfaces first disaster as active with pending fullscreen after month 22", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.funds = 10000;
    settleTo(controller, 23);
    const panel = createScreenEventsPanel(controller);
    const snapshot = panel.getSnapshot();
    const first = snapshot.active.find((e) => e.seq === 1);
    expect(first).toBeDefined();
    if (!first) return;
    expect(first.needsAcknowledgement).toBe(true);
    expect(snapshot.pendingFullscreenQueue.map((e) => e.seq)).toEqual([1]);
    expect(snapshot.pendingFullscreen?.seq).toBe(1);
    expect(snapshot.upcoming.map((e) => e.seq)).toEqual([2, 3, 4]);
    const modal = panel.getPendingFullscreenModal();
    expect(modal).not.toBeNull();
    if (!modal) return;
    expect(modal.copy).toEqual({
      titleKey: "events.modal.disaster_exam_1.title",
      summaryKey: "events.modal.disaster_exam_1.summary",
      impactKey: "events.modal.disaster_exam_1.impact",
      acknowledgeButtonKey: "events.modal.action.acknowledge"
    });
  });

  it("acknowledge clears pending fullscreen flag", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.funds = 10000;
    settleTo(controller, 23);
    const panel = createScreenEventsPanel(controller);
    const ack = panel.acknowledgeNextPending();
    expect(ack.ok).toBe(true);
    expect(ack.uiErrorCode).toBeNull();
    expect(ack.uiCopy).toBeNull();
    expect(ack.after.pendingFullscreen).toBeNull();
    expect(controller.state.acknowledgedDisasterSeqs).toContain(1);
    expect(panel.getPendingFullscreenModal()).toBeNull();
    const repeat = panel.acknowledgeNextPending();
    expect(repeat.ok).toBe(false);
    expect(repeat.uiErrorCode).toBe("no_pending_modal");
    expect(repeat.uiCopy).toEqual({
      messageKey: "events_panel.error.no_pending_modal",
      actionKey: "events_panel.action.close_panel"
    });
  });

  it("acknowledgeFullscreen reports not_active for not-yet-triggered disasters", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const panel = createScreenEventsPanel(controller);
    const ack = panel.acknowledgeFullscreen(2);
    expect(ack.ok).toBe(false);
    expect(ack.uiErrorCode).toBe("event_not_active");
    expect(ack.uiCopy).toEqual({
      messageKey: "events_panel.error.event_not_active",
      actionKey: "events_panel.action.refresh_list"
    });
  });

  it("acknowledgeFullscreen reports not_found for unknown seq", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const panel = createScreenEventsPanel(controller);
    const ack = panel.acknowledgeFullscreen(999);
    expect(ack.ok).toBe(false);
    expect(ack.uiErrorCode).toBe("event_not_found");
  });

  it("moves expired disasters out of active after debuff completes", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.funds = 10000;
    settleTo(controller, 23);
    const panel = createScreenEventsPanel(controller);
    expect(panel.getSnapshot().active.find((e) => e.seq === 1)).toBeDefined();
    settleTo(controller, 33);
    const after = panel.getSnapshot();
    expect(after.active.find((e) => e.seq === 1)).toBeUndefined();
    expect(after.expired.find((e) => e.seq === 1)).toBeDefined();
  });

  it("returns final-disaster acknowledge button key for final modal", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const panel = createScreenEventsPanel(controller);
    const finalCopy = panel.getEventModalCopyBySeq(4);
    expect(finalCopy).toEqual({
      titleKey: "events.modal.disaster_exam_final.title",
      summaryKey: "events.modal.disaster_exam_final.summary",
      impactKey: "events.modal.disaster_exam_final.impact",
      acknowledgeButtonKey: "events.modal.action.acknowledge_final"
    });
  });

  it("applies active slot window and priority ordering when disasters overlap", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.funds = 10000;
    const disasters = controller.config.bundle.disasters;
    const second = disasters.find((d) => d.seq === 2);
    const third = disasters.find((d) => d.seq === 3);
    const final = disasters.find((d) => d.seq === 4);
    expect(second && third && final).toBeTruthy();
    if (!second || !third || !final) return;
    second.trigger_month = 23;
    second.debuff_duration_months = 12;
    third.trigger_month = 24;
    third.debuff_duration_months = 12;
    final.trigger_month = 25;
    final.debuff_duration_months = 12;

    settleTo(controller, 26);
    const panel = createScreenEventsPanel(controller);
    const snapshot = panel.getSnapshot();
    expect(snapshot.activeCount).toBe(4);
    expect(snapshot.visibleActive.map((e) => e.seq)).toEqual([4, 2, 3]);
    expect(snapshot.hiddenActive.map((e) => e.seq)).toEqual([1]);
    expect(snapshot.activeOverflowCount).toBe(1);
    expect(snapshot.pendingFullscreenQueue.map((e) => e.seq)).toEqual([4, 2, 3, 1]);
    expect(snapshot.pendingFullscreen?.seq).toBe(4);
  });
});
