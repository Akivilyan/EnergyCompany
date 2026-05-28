import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo, createInitialState, dispatch, settleNextMonth, defaultPorts } from "../../src/sim/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("settleNextMonth", () => {
  it("runs M1-M14 in order", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    let state = createInitialState(config);
    const result = settleNextMonth(state, config, defaultPorts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.report.steps).toHaveLength(14);
    expect(result.value.report.steps.map((s) => s.stepId)).toEqual([
      "M2_grid_progress",
      "M3_research_progress",
      "M1_construction_progress",
      "M4_supply_recalc",
      "M5_income_settlement",
      "M6_opex_settlement",
      "M7_fuel_settlement",
      "M8_loan_settlement",
      "M9_social_value_settlement",
      "M10_company_level_check",
      "M11_events_apply",
      "M12_milestones_emit",
      "M13_bankrupt_check",
      "M14_victory_check"
    ]);
  });

  it("applies disaster at M22 with locked debuff duration from config", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const d22 = config.bundle.disasters.find((d) => d.trigger_month === 22);
    expect(d22?.debuff_duration_months).toBe(8);

    let state = createInitialState(config);
    state.funds = 800;
    while (state.currentMonth < 22 && state.runResult === null) {
      const month = settleNextMonth(state, config, defaultPorts);
      expect(month.ok).toBe(true);
      if (!month.ok) return;
      state = month.value.state;
      state.funds = Math.max(state.funds, 100);
    }
    expect(state.currentMonth).toBe(22);
    const month22 = settleNextMonth(state, config, defaultPorts);
    expect(month22.ok).toBe(true);
    if (!month22.ok) return;
    state = month22.value.state;
    expect(state.disastersTriggered).toContain(1);
    expect(state.activeDebuffs.some((d) => d.disasterSeq === 1 && d.monthsRemaining === 8)).toBe(true);
  });

  it("dispatch fails atomically on insufficient funds", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config);
    state.funds = 0;
    const before = structuredClone(state);
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "nuclear", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    expect(state.funds).toBe(before.funds);
  });
});
