import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenCityDetail } from "../../src/modules/screenCityDetail.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("ScreenCityDetail", () => {
  it("supports city build action for UI shell", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenCityDetail(controller, "CITY-START");
    const build = screen.queueConstruction("wind", 1);

    expect(build.ok).toBe(true);
    if (!build.ok) return;
    expect(build.value.result.ok).toBe(true);
    expect(build.value.before.month).toBe(1);
    expect(build.value.after.constructionQueueInCity).toBe(
      build.value.before.constructionQueueInCity + 1
    );
  });

  it("returns monthly deltas for multi-step advance", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
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

  it("returns not_found when city does not exist", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
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
