import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenCityDetail } from "../../src/modules/screenCityDetail.js";


describe("ScreenCityDetail", () => {
  it("provides the three formal build candidates from sim truth", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCityDetail(controller, "CITY-START");
    const choice = screen.getBuildChoice("slot-7");

    expect(choice.ok).toBe(true);
    if (!choice.ok) return;
    expect(choice.value.candidates.map((candidate) => candidate.facilityId)).toEqual([
      "wind",
      "solar",
      "thermal"
    ]);
    expect(choice.value.candidates[0]).toMatchObject({
      buildCost: 12,
      buildMonths: 2,
      effectiveOutputMw: 42,
      monthlyOpex: 1,
      enabled: true
    });
    expect(choice.value.buildSlotsMax).toBe(7);
  });

  it("supports a slot-bound city build action", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCityDetail(controller, "CITY-START");
    const build = screen.queueConstruction("wind", 1, "slot-7");

    expect(build.ok).toBe(true);
    if (!build.ok) return;
    expect(build.value.result.ok).toBe(true);
    expect(build.value.before.month).toBe(1);
    expect(build.value.after.constructionQueueInCity).toBe(
      build.value.before.constructionQueueInCity + 1
    );
    expect(build.value.after.constructionProjects[0].slotId).toBe("slot-7");
    expect(build.value.after.funds).toBe(191);
  });

  it("returns monthly deltas for multi-step advance", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCityDetail(controller, "CITY-START");

    const build = screen.queueConstruction("wind", 1);
    expect(build.ok).toBe(true);
    if (!build.ok || !build.value.result.ok) return;

    const advance = screen.advanceMonths(3);
    expect(advance.failed).toBeNull();
    expect(advance.reports).toHaveLength(3);
    expect(advance.reports[0].monthFrom).toBe(1);
    expect(advance.reports[2].monthTo).toBe(4);
    expect(advance.reports[1].delta.effectiveSupplyMw).toBeGreaterThanOrEqual(0);
  });

  it("reports progress, same-month completion supply, recurring funds and EXP", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCityDetail(controller, "CITY-START");
    const build = screen.queueConstruction("thermal", 1, "slot-2");
    expect(build.ok).toBe(true);
    if (!build.ok || !build.value.result.ok) return;

    const month2 = screen.advanceOneMonth();
    const month3 = screen.advanceOneMonth();
    const month4 = screen.advanceOneMonth();
    expect(month2.ok && month3.ok && month4.ok).toBe(true);
    if (!month2.ok || !month3.ok || !month4.ok) return;
    expect(month2.value.projectUpdates[0]).toMatchObject({ state: "progress", monthsLeft: 2 });
    expect(month3.value.projectUpdates[0]).toMatchObject({ state: "progress", monthsLeft: 1 });
    expect(month4.value.projectUpdates[0]).toMatchObject({
      state: "completed",
      facilityId: "thermal",
      slotId: "slot-2"
    });
    expect(month4.value.delta.effectiveSupplyMw).toBeGreaterThan(0);
    expect(month4.value.after.recurringFundsDeltaEstimate).toBeGreaterThan(0);
    expect(month4.value.delta.socialValue).toBeGreaterThan(0);
  });

  it("returns not_found when city does not exist", () => {
    const controller = createTestController(repoRoot);
    const screen = createScreenCityDetail(controller, "CITY-NOT-EXIST");

    const build = screen.queueConstruction("wind", 1);
    expect(build.ok).toBe(false);
    if (!build.ok) {
      expect(build.error).toBe("not_found");
    }

    const month = screen.advanceOneMonth();
    expect(month.ok).toBe(false);
    if (!month.ok) {
      expect(month.error).toBe("not_found");
    }
  });
});
