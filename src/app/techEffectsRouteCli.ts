#!/usr/bin/env node
/**
 * FAST-01 technology effect smoke.
 *
 * Verifies that key demo tech branches are not only visible in HUDs: they also
 * change construction, grid, loans, disaster pressure, ecology, and supply.
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenCompany } from "../modules/screenCompany.js";
import {
  createInitialState,
  defaultPorts,
  dispatch,
  settleNextMonth,
  type ConfigRepo,
  type GameState
} from "../sim/index.js";

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

function nextMonth(state: GameState, config: ConfigRepo): GameState {
  const out = settleNextMonth(state, config, defaultPorts);
  if (!out.ok) fail(`settle failed: ${out.error} - ${out.message}`);
  return out.value.state;
}

function stepMetric(state: GameState, config: ConfigRepo, stepId: string, key: string): number {
  const out = settleNextMonth(state, config, defaultPorts);
  if (!out.ok) fail(`settle failed: ${out.error} - ${out.message}`);
  const value = out.value.report.steps.find((step) => step.stepId === stepId)?.metrics[key];
  ensure(typeof value === "number", `missing metric ${stepId}.${key}`);
  return value ?? 0;
}

function checkConstructionDiscount(config: ConfigRepo): void {
  const state = createInitialState(config);
  state.litTechIds.push("eng_bulk_procure");
  state.funds = 100;
  const out = dispatch(
    state,
    { type: "queue_construction", cityId: "CITY-START", facilityId: "wind", tier: 1 },
    config,
    defaultPorts
  );
  if (!out.ok) fail(`construction discount dispatch failed: ${out.error}`);
  const spent = state.funds - out.value.state.funds;
  ensure(spent === 11, `expected discounted wind cost 11, got ${spent}`);
  pass("construction-discount", `wind cost=${spent}`);
}

function checkStorageSupply(config: ConfigRepo): void {
  const base = createInitialState(config);
  base.constructionQueue.push({
    id: "cq-base-wind",
    cityId: "CITY-START",
    facilityId: "wind",
    tier: 1,
    monthsRemaining: 0,
    installmentRemaining: 0
  });
  const boosted = structuredClone(base);
  boosted.litTechIds.push("storage_system_1");

  const baseNext = nextMonth(base, config);
  const boostedNext = nextMonth(boosted, config);
  const baseSupply = baseNext.cities["CITY-START"].localSupplyMw;
  const boostedSupply = boostedNext.cities["CITY-START"].localSupplyMw;
  ensure(boostedSupply > baseSupply, `expected storage supply boost, got ${baseSupply}->${boostedSupply}`);
  pass("storage-supply", `${baseSupply}->${boostedSupply}MW`);
}

function checkGridEffects(config: ConfigRepo): void {
  const state = createInitialState(config);
  state.companyLevel = 5;
  state.funds = 100;
  state.litTechIds.push("grid_regional", "grid_backbone", "uhv_transmission", "eng_grid_dispatch");
  const regional = dispatch(
    state,
    {
      type: "queue_grid_link",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP01-02",
      linkType: "region"
    },
    config,
    defaultPorts
  );
  if (!regional.ok) fail(`regional grid dispatch failed: ${regional.error}`);
  const regionalLink = regional.value.state.gridLinks["CITY-MAP01-02::CITY-START"];
  ensure(regionalLink?.buildCost === 6, `expected regional discounted cost 6, got ${regionalLink?.buildCost}`);
  ensure(regionalLink.lossMw === 112, `expected dispatch loss 112, got ${regionalLink.lossMw}`);

  const trunk = dispatch(
    regional.value.state,
    {
      type: "queue_grid_link",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP06-01",
      linkType: "trunk"
    },
    config,
    defaultPorts
  );
  if (!trunk.ok) fail(`trunk grid dispatch failed: ${trunk.error}`);
  const trunkLink = trunk.value.state.gridLinks["CITY-MAP06-01::CITY-START"];
  ensure(trunkLink?.buildCost === 6, `expected trunk discounted cost 6, got ${trunkLink?.buildCost}`);
  ensure(trunkLink.lossMw === 500, `expected UHV loss 500, got ${trunkLink.lossMw}`);
  pass("grid-effects", `region cost/loss=${regionalLink.buildCost}/${regionalLink.lossMw}, trunk=${trunkLink.buildCost}/${trunkLink.lossMw}`);
}

function checkCashflowLoan(): void {
  const controller = createControllerFromRepoRoot();
  controller.state.companyLevel = 4;
  controller.state.litTechIds.push("eng_cashflow");
  const company = createScreenCompany(controller);
  const loan = company.applyLoan("loan_5");
  ensure(loan.result.ok, `loan_5 should unlock through cashflow, got ${loan.uiErrorCode ?? "failed"}`);
  pass("cashflow-loan", `active=${loan.after.activeLoan?.loanId ?? "none"}`);
}

function checkRiskReserve(config: ConfigRepo): void {
  const disaster = config.bundle.disasters.find((item) => item.trigger_month === 22);
  if (!disaster) fail("missing M22 disaster");
  let state = createInitialState(config);
  state.companyLevel = 4;
  state.funds = 800;
  state.litTechIds.push("eng_risk_reserve");
  while (state.currentMonth < 22 && state.runResult === null) {
    state = nextMonth(state, config);
    state.funds = Math.max(state.funds, 100);
  }
  const penalty = stepMetric(state, config, "M11_events_apply", "disaster_penalty");
  ensure(penalty === 3, `expected risk reserve M22 penalty 3, got ${penalty}`);
  pass("risk-reserve", `M22 penalty=${penalty}`);
}

function checkEcoAndGreenBrand(config: ConfigRepo): void {
  const eco = createInitialState(config);
  eco.litTechIds.push("eco_thermal");
  eco.facilities["fac-thermal"] = {
    id: "fac-thermal",
    cityId: "CITY-START",
    facilityId: "thermal",
    tier: 1,
    outputMw: 160,
    monthlyOpex: 12,
    monthlyFuel: 8,
    isEco: false
  };
  const ecoNext = nextMonth(eco, config);
  ensure(ecoNext.cities["CITY-START"].ecoCapFactor === 1, "thermal eco sync should restore eco cap");
  ecoNext.cities["CITY-START"].demandMw = 100;
  ecoNext.cities["CITY-START"].cityBaseSocialValue = 40;

  const base = structuredClone(ecoNext);
  base.litTechIds = base.litTechIds.filter((techId) => techId !== "eng_green_pr");
  const green = structuredClone(ecoNext);
  green.litTechIds.push("eng_green_pr");
  const baseSv = stepMetric(base, config, "M9_social_value_settlement", "social_value");
  const greenSv = stepMetric(green, config, "M9_social_value_settlement", "social_value");
  ensure(greenSv > baseSv, `expected green brand SV bonus, got ${baseSv}->${greenSv}`);
  pass("eco-green-brand", `sv=${baseSv}->${greenSv}`);
}

function runTechEffectsRoute(): void {
  const config = createControllerFromRepoRoot().config;
  console.log("=== Energy Company FAST-01 tech effects route ===");
  checkConstructionDiscount(config);
  checkStorageSupply(config);
  checkGridEffects(config);
  checkCashflowLoan();
  checkRiskReserve(config);
  checkEcoAndGreenBrand(config);
  console.log("---");
  console.log(`Tech effects route summary: passed=${checks.length}`);
}

try {
  runTechEffectsRoute();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`[FAIL] tech-effects-route | ${message}`);
  process.exit(1);
}
