import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenRunResult } from "../../src/modules/screenRunResult.js";


describe("ScreenRunResult", () => {
  it("returns null before run result phase", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenRunResult(controller);
    expect(screen.getSnapshot()).toBeNull();
  });

  it("supports victory snapshot", () => {
    const controller = createTestController(repoRoot);
    const finalDisaster = controller.config.bundle.disasters.find((d) => d.is_final);
    expect(finalDisaster).toBeTruthy();
    if (!finalDisaster) return;
    controller.state.currentMonth = controller.config.bundle.runConfig.campaign_run_target_months;
    controller.state.disastersTriggered.push(finalDisaster.seq);
    controller.state.funds = 10;
    controller.state.cities["CITY-START"].demandMw = 0;
    const month = controller.runNextMonth();
    expect(month.ok).toBe(true);
    const screen = createScreenRunResult(controller);
    const snapshot = screen.getSnapshot();
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;
    expect(snapshot.runResult).toBe("victory");
    expect(snapshot.finalDisasterTriggered).toBe(true);
    expect(snapshot.canRunPlayableCommands).toBe(false);
  });

  it("supports bankrupt snapshot", () => {
    const controller = createTestController(repoRoot);
    controller.state.funds = -100;
    controller.state.bankruptConsecutiveMonths =
      controller.config.bundle.runConfig.bankrupt_consecutive_months - 1;
    controller.state.cities["CITY-START"].demandMw = 0;
    const month = controller.runNextMonth();
    expect(month.ok).toBe(true);
    const screen = createScreenRunResult(controller);
    const snapshot = screen.getSnapshot();
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;
    expect(snapshot.runResult).toBe("bankrupt");
    expect(snapshot.canRunPlayableCommands).toBe(false);
  });
});
