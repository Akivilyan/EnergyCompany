#!/usr/bin/env node
/**
 * FAST-01 disaster pressure route smoke.
 *
 * Verifies the disaster axis as a playable pressure loop: warning prep,
 * risk-reserve mitigation, active impact, acknowledgement, recovery actions,
 * and all four fixed disasters including the final one.
 */
import {
  eventsAcknowledgeNextPending,
  formatActiveEventPressureLine,
  formatActiveEventRecoveryActionLine,
  formatDisasterAxisProgressLine,
  formatPendingEventModalLines,
  formatUpcomingEventPrepActionLine,
  formatUpcomingEventRiskLine,
  formatUpcomingEventRiskOpportunityLine
} from "./eventsHudController.js";
import {
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd
} from "./companyHudController.js";
import { cityHudAdvanceMonth } from "./cityHudController.js";
import { createGameBootstrapFromRepo } from "./gameBootstrap.node.js";
import { setLocale } from "../i18n/index.js";
import type { GameBootstrap } from "./gameBootstrap.js";

interface Check {
  id: string;
  detail: string;
}

const checks: Check[] = [];

function fail(message: string): never {
  throw new Error(message);
}

function ensure(condition: boolean, message: string): void {
  if (!condition) fail(message);
}

function pass(id: string, detail: string): void {
  checks.push({ id, detail });
  console.log(`[PASS] ${id} | ${detail}`);
}

function createBoot(): GameBootstrap {
  const boot = createGameBootstrapFromRepo();
  boot.app.controller.state.funds = 10000;
  return boot;
}

function settleTo(boot: GameBootstrap, targetMonth: number): void {
  while (boot.app.controller.state.currentMonth < targetMonth && boot.app.controller.state.runResult === null) {
    const out = cityHudAdvanceMonth(boot);
    if (!out.ok) fail(`settle failed: ${out.errorCode ?? "unknown"}`);
  }
  ensure(
    boot.app.controller.state.currentMonth >= targetMonth,
    `expected month ${targetMonth}, got ${boot.app.controller.state.currentMonth}`
  );
}

function checkPrepAndMitigation(): void {
  const boot = createBoot();
  settleTo(boot, 15);

  boot.app.controller.state.companyLevel = 4;
  boot.app.controller.state.funds = 10;
  const prepCash = formatUpcomingEventPrepActionLine(boot);
  ensure(!!prepCash && prepCash.includes("还差"), `expected cash-gap prep line, got ${prepCash ?? "none"}`);
  const cashBefore = boot.app.controller.state.funds;
  const ad = companyClaimCashByAd(boot);
  ensure(ad.ok, `cash ad failed: ${ad.uiErrorCode ?? "unknown"}`);
  ensure(boot.app.controller.state.funds > cashBefore, "cash ad should improve prep buffer");
  pass("prep-cash-action", `funds=${cashBefore}->${boot.app.controller.state.funds}`);

  boot.app.controller.state.funds = 100;
  const opportunity = formatUpcomingEventRiskOpportunityLine(boot);
  ensure(!!opportunity && opportunity.includes("风险储备机会"), `expected risk opportunity, got ${opportunity ?? "none"}`);
  boot.app.controller.state.litTechIds.push("eng_risk_reserve");
  const risk = formatUpcomingEventRiskLine(boot);
  if (!risk || !risk.includes("7/9")) fail(`expected reduced M22 penalty, got ${risk ?? "none"}`);
  const hold = formatUpcomingEventPrepActionLine(boot);
  ensure(!!hold && hold.includes("现金已达17"), `expected hold prep line, got ${hold ?? "none"}`);
  pass("risk-reserve-prep", risk);
}

function checkImpactAckAndRecovery(): void {
  const boot = createBoot();
  settleTo(boot, 23);
  const modal = formatPendingEventModalLines(boot);
  if (!modal) fail("expected pending disaster modal");
  ensure(modal.ackKey === "events.modal.action.acknowledge", `expected normal ack key, got ${modal.ackKey}`);

  const pressure = formatActiveEventPressureLine(boot);
  if (!pressure || !pressure.includes("收入92%")) {
    fail(`expected active pressure line, got ${pressure ?? "none"}`);
  }
  const ack = eventsAcknowledgeNextPending(boot);
  ensure(ack.ok, `ack failed: ${ack.uiErrorCode ?? "unknown"}`);
  ensure(formatPendingEventModalLines(boot) === null, "pending modal should clear after ack");
  pass("impact-ack", pressure);

  boot.app.controller.state.funds = 20;
  boot.app.controller.state.adsRemaining = 1;
  const adLine = formatActiveEventRecoveryActionLine(boot);
  ensure(!!adLine && adLine.includes("广告补现金"), `expected ad recovery, got ${adLine ?? "none"}`);
  const cash = companyClaimCashByAd(boot);
  ensure(cash.ok, `recovery ad failed: ${cash.uiErrorCode ?? "unknown"}`);

  boot.app.controller.state.funds = 100;
  boot.app.controller.state.adsRemaining = 0;
  boot.app.controller.state.loans = {};
  const loanLine = formatActiveEventRecoveryActionLine(boot);
  ensure(!!loanLine && loanLine.includes("贷款"), `expected loan recovery, got ${loanLine ?? "none"}`);
  const loan = companyApplyFirstUnlockedLoan(boot);
  ensure(loan.ok, `recovery loan failed: ${loan.uiErrorCode ?? "unknown"}`);

  boot.app.controller.state.funds = 1000;
  const holdLine = formatActiveEventRecoveryActionLine(boot);
  ensure(!!holdLine && holdLine.includes("保守推进"), `expected hold recovery, got ${holdLine ?? "none"}`);
  pass("recovery-actions", "ad/loan/hold");
}

function checkAllDisasterAcknowledgements(): void {
  const boot = createBoot();
  const triggerMonths = [23, 42, 64];
  const acknowledged: number[] = [];

  for (const targetMonth of triggerMonths) {
    boot.app.controller.state.funds = Math.max(boot.app.controller.state.funds, 10000);
    settleTo(boot, targetMonth);
    const modal = formatPendingEventModalLines(boot);
    if (!modal) fail(`expected pending modal at M${targetMonth}`);
    const pending = boot.app.screens.events.getSnapshot().pendingFullscreen;
    if (!pending) fail(`missing pending entry at M${targetMonth}`);
    if (pending.isFinal) {
      ensure(
        modal.ackKey === "events.modal.action.acknowledge_final",
        `expected final ack key, got ${modal.ackKey}`
      );
    }
    const ack = eventsAcknowledgeNextPending(boot);
    ensure(ack.ok, `ack seq ${pending.seq} failed: ${ack.uiErrorCode ?? "unknown"}`);
    acknowledged.push(pending.seq);
  }

  while (!boot.app.controller.state.disastersTriggered.includes(4) && boot.app.controller.state.runResult === null) {
    boot.app.controller.state.funds = Math.max(boot.app.controller.state.funds, 10000);
    const out = cityHudAdvanceMonth(boot);
    if (!out.ok) fail(`settle to final disaster failed: ${out.errorCode ?? "unknown"}`);
  }
  ensure(boot.app.controller.state.disastersTriggered.includes(4), "final disaster should trigger");
  const finalModal = formatPendingEventModalLines(boot);
  if (!finalModal) fail("expected final disaster pending modal");
  ensure(
    finalModal.ackKey === "events.modal.action.acknowledge_final",
    `expected final ack key, got ${finalModal.ackKey}`
  );
  const finalPending = boot.app.screens.events.getSnapshot().pendingFullscreen;
  ensure(finalPending?.seq === 4, `expected final pending seq 4, got ${finalPending?.seq ?? "none"}`);
  const finalAck = eventsAcknowledgeNextPending(boot);
  ensure(finalAck.ok, `ack seq 4 failed: ${finalAck.uiErrorCode ?? "unknown"}`);
  acknowledged.push(4);

  ensure(acknowledged.join(",") === "1,2,3,4", `expected ack 1,2,3,4, got ${acknowledged.join(",")}`);
  const axis = formatDisasterAxisProgressLine(boot);
  ensure(!!axis && axis.includes("已过4/4"), `expected completed axis, got ${axis ?? "none"}`);
  pass("all-disaster-ack", `acked=${acknowledged.join("->")}`);
}

function runDisasterPressureRoute(): void {
  setLocale("zh-CN");
  console.log("=== Energy Company FAST-01 disaster pressure route ===");
  checkPrepAndMitigation();
  checkImpactAckAndRecovery();
  checkAllDisasterAcknowledgements();
  console.log("---");
  console.log(`Disaster pressure route summary: passed=${checks.length}`);
}

try {
  runDisasterPressureRoute();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`[FAIL] disaster-pressure-route | ${message}`);
  process.exit(1);
}
