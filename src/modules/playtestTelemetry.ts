import type { SettlementReport } from "../sim/index.js";
import type { ControllerTraceEntry, RunController } from "./runController.js";

export type PlaytestEventType = "command" | "settle";

export interface PlaytestEvent {
  seq: number;
  type: PlaytestEventType;
  month: number;
  ok: boolean;
  action: string;
  result: string;
  context: Record<string, number | string | boolean>;
}

export interface PlaytestTelemetryBundle {
  meta: {
    runId: string;
    doctrineId: string;
    difficultyId: string;
    generatedAtMonth: number;
  };
  summary: {
    totalEvents: number;
    commandCount: number;
    settleCount: number;
    failedCount: number;
    lastRunResult: string;
  };
  events: PlaytestEvent[];
}

function toCommandEvent(seq: number, trace: Extract<ControllerTraceEntry, { kind: "command" }>): PlaytestEvent {
  return {
    seq,
    type: "command",
    month: trace.month,
    ok: trace.ok,
    action: trace.commandType,
    result: trace.ok ? "ok" : trace.error ?? "failed",
    context: trace.error ? { error: trace.error } : {}
  };
}

function findSettlementByMonth(
  reportsByMonthFrom: Map<number, SettlementReport>,
  month: number
): SettlementReport | null {
  return reportsByMonthFrom.get(month) ?? null;
}

function toSettleEvent(
  seq: number,
  trace: Extract<ControllerTraceEntry, { kind: "settle" }>,
  report: SettlementReport | null
): PlaytestEvent {
  if (!trace.ok) {
    return {
      seq,
      type: "settle",
      month: trace.month,
      ok: false,
      action: "next_month",
      result: trace.error ?? "failed",
      context: trace.error ? { error: trace.error } : {}
    };
  }
  return {
    seq,
    type: "settle",
    month: trace.month,
    ok: true,
    action: "next_month",
    result: trace.result ?? "continue",
    context: {
      month_to: report?.monthTo ?? trace.month + 1,
      step_count: report?.steps.length ?? 0
    }
  };
}

export function exportPlaytestTelemetry(controller: RunController): PlaytestTelemetryBundle {
  const trace = controller.getTrace();
  const settlementHistory = controller.getSettlementHistory();
  const reportsByMonthFrom = new Map<number, SettlementReport>();
  for (const report of settlementHistory) {
    reportsByMonthFrom.set(report.monthFrom, report);
  }

  const events: PlaytestEvent[] = [];
  trace.forEach((item, index) => {
    const seq = index + 1;
    if (item.kind === "command") {
      events.push(toCommandEvent(seq, item));
      return;
    }
    const report = findSettlementByMonth(reportsByMonthFrom, item.month);
    events.push(toSettleEvent(seq, item, report));
  });

  const state = controller.state;
  const commandCount = events.filter((event) => event.type === "command").length;
  const settleCount = events.filter((event) => event.type === "settle").length;
  const failedCount = events.filter((event) => !event.ok).length;

  return {
    meta: {
      runId: state.runId,
      doctrineId: state.doctrineId,
      difficultyId: state.difficultyId,
      generatedAtMonth: state.currentMonth
    },
    summary: {
      totalEvents: events.length,
      commandCount,
      settleCount,
      failedCount,
      lastRunResult: state.runResult ?? "ongoing"
    },
    events
  };
}
