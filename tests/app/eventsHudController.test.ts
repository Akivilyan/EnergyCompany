import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import type { GameBootstrap } from "../../src/app/gameBootstrap.js";
import {
  eventsAcknowledgeNextPending,
  formatActiveEventPressureLine,
  formatEventsHudHint,
  formatPendingEventModalLines,
  formatUpcomingEventRiskLine
} from "../../src/app/eventsHudController.js";
import { cityHudAdvanceMonth } from "../../src/app/cityHudController.js";
import { setLocale } from "../../src/i18n/index.js";

function settleToMonth(boot: GameBootstrap, target: number): void {
  while (boot.app.controller.state.currentMonth < target && boot.app.controller.state.runResult === null) {
    const out = cityHudAdvanceMonth(boot);
    if (!out.ok) throw new Error(`advance failed: ${out.errorCode}`);
  }
}

describe("eventsHudController", () => {
  it("surfaces pending modal after month 22 disaster", () => {
    setLocale("zh-CN");
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.funds = 10000;
    settleToMonth(boot, 23);

    const modal = formatPendingEventModalLines(boot);
    expect(modal).not.toBeNull();
    expect(modal?.title).toContain("考核");
    expect(formatEventsHudHint(boot)).toContain("待确认");

    const ack = eventsAcknowledgeNextPending(boot);
    expect(ack.ok).toBe(true);
    expect(formatPendingEventModalLines(boot)).toBeNull();

    const repeat = eventsAcknowledgeNextPending(boot);
    expect(repeat.ok).toBe(false);
    expect(repeat.uiErrorCode).toBe("no_pending_modal");
  });

  it("formats active disaster pressure and risk-reserve prep lines", () => {
    setLocale("zh-CN");
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_risk_reserve");

    expect(formatUpcomingEventRiskLine(boot)).toBe("灾害备考：M22现金冲击7/9 · 风险储备生效");

    boot.app.controller.state.funds = 10000;
    settleToMonth(boot, 23);

    expect(formatActiveEventPressureLine(boot)).toBe(
      "灾害压力：剩8月 · 收入92% · 建设108% · 科研108%"
    );
  });
});
