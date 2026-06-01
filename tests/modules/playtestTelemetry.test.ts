import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { exportPlaytestTelemetry } from "../../src/modules/playtestTelemetry.js";
import { RunController } from "../../src/modules/runController.js";


describe("playtestTelemetry", () => {
  it("exports structured command/settle event stream", () => {
    const controller = createTestController(repoRoot);
    const command = controller.runCommand({
      type: "queue_construction",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1
    });
    expect(command.ok).toBe(true);
    const settle = controller.runNextMonth();
    expect(settle.ok).toBe(true);

    const out = exportPlaytestTelemetry(controller);
    expect(out.meta.runId).toBe(controller.state.runId);
    expect(out.summary.totalEvents).toBe(2);
    expect(out.summary.commandCount).toBe(1);
    expect(out.summary.settleCount).toBe(1);
    expect(out.summary.failedCount).toBe(0);
    expect(out.events[0].type).toBe("command");
    expect(out.events[0].action).toBe("queue_construction");
    expect(out.events[1].type).toBe("settle");
    expect(out.events[1].context.step_count).toBeGreaterThanOrEqual(1);
  });

  it("records failed commands in summary and event context", () => {
    const controller = createTestController(repoRoot);
    const fail = controller.runCommand({
      type: "start_research",
      techId: "storage_system_1"
    });
    expect(fail.ok).toBe(false);

    const out = exportPlaytestTelemetry(controller);
    expect(out.summary.failedCount).toBe(1);
    expect(out.summary.totalEvents).toBe(1);
    expect(out.events[0].ok).toBe(false);
    expect(out.events[0].result).toBe("not_unlocked");
    expect(out.events[0].context.error).toBe("not_unlocked");
  });
});
