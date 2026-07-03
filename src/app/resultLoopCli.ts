#!/usr/bin/env node
/**
 * Run-result screen smoke.
 * Verifies victory / bankrupt branches, readable result snapshots, terminal route
 * summary, and command blocking after run_result.
 *
 * Usage:
 *   npm run sim:result-loop
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenRunResult } from "../modules/screenRunResult.js";

function fail(message: string): never {
  console.log(message);
  process.exit(1);
}

function ensure(condition: boolean, message: string): void {
  if (!condition) fail(message);
}

function runVictoryBranch(): void {
  const controller = createControllerFromRepoRoot();
  const finalDisaster = controller.config.bundle.disasters.find((item) => item.is_final);
  if (!finalDisaster) {
    fail("victory branch failed: missing final disaster config");
  }
  controller.state.currentMonth = controller.config.bundle.runConfig.campaign_run_target_months;
  controller.state.disastersTriggered.push(finalDisaster.seq);
  controller.state.funds = 20;
  controller.state.companyLevel = 5;
  controller.state.cities["CITY-START"].demandMw = 0;
  controller.state.gridLinks["CITY-METB-01::CITY-START"] = {
    linkId: "CITY-METB-01::CITY-START",
    fromCityId: "CITY-START",
    toCityId: "CITY-METB-01",
    linkType: "trunk",
    status: "finished",
    monthsRemaining: 0,
    lossMw: 250
  };
  controller.state.gridLinks["CITY-METB-01::SUPER-HYDRO-1"] = {
    linkId: "CITY-METB-01::SUPER-HYDRO-1",
    fromCityId: "CITY-METB-01",
    toCityId: "SUPER-HYDRO-1",
    linkType: "trunk",
    status: "finished",
    monthsRemaining: 0,
    lossMw: 250
  };
  controller.state.superHydros["super_hydro_1"] = {
    slotId: "super_hydro_1",
    nodeId: "SUPER-HYDRO-1",
    displayName: "Jinsha River UHV Hydro Base",
    status: "finished",
    monthsRemaining: 0,
    outputMw: 1800
  };
  const month = controller.runNextMonth();
  if (!month.ok) {
    fail(`victory settle failed: ${month.error} - ${month.message}`);
  }
  const screen = createScreenRunResult(controller);
  const snapshot = screen.getSnapshot();
  if (!snapshot) {
    fail("victory screen snapshot missing");
  }
  ensure(snapshot.runResult === "victory", "victory branch did not end with victory");
  ensure(snapshot.finalDisasterTriggered, "victory branch missing final disaster");
  ensure(snapshot.terminalRoute.metBConnected, "victory branch missing MET-B trunk");
  ensure(
    snapshot.terminalRoute.superHydroConnectedOutputMw > 0,
    "victory branch missing connected super hydro output"
  );
  const blocked = controller.runCommand({ type: "claim_ad_reward", adType: "cash" });
  console.log(
    `victory: result=${snapshot.runResult}, month=${snapshot.month}, finalTriggered=${snapshot.finalDisasterTriggered}, metB=${snapshot.terminalRoute.metBConnected}, superHydro=${snapshot.terminalRoute.superHydroConnectedOutputMw}/${snapshot.terminalRoute.superHydroTotalOutputMw}, commandBlocked=${!blocked.ok}`
  );
}

function runBankruptBranch(): void {
  const controller = createControllerFromRepoRoot();
  controller.state.funds = -100;
  controller.state.bankruptConsecutiveMonths =
    controller.config.bundle.runConfig.bankrupt_consecutive_months - 1;
  controller.state.cities["CITY-START"].demandMw = 0;
  const month = controller.runNextMonth();
  if (!month.ok) {
    fail(`bankrupt settle failed: ${month.error} - ${month.message}`);
  }
  const screen = createScreenRunResult(controller);
  const snapshot = screen.getSnapshot();
  if (!snapshot) {
    fail("bankrupt screen snapshot missing");
  }
  ensure(snapshot.runResult === "bankrupt", "bankrupt branch did not end with bankrupt");
  const blocked = controller.runCommand({
    type: "queue_construction",
    cityId: "CITY-START",
    facilityId: "wind",
    tier: 1
  });
  console.log(
    `bankrupt: result=${snapshot.runResult}, month=${snapshot.month}, funds=${snapshot.funds}, commandBlocked=${!blocked.ok}`
  );
}

console.log("=== Energy Company run-result loop smoke ===");
runVictoryBranch();
runBankruptBranch();
