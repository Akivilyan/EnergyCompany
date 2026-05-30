import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGameApp } from "../../src/app/gameApp.js";
import { createGameShell } from "../../src/ui/gameShell.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("GameShell", () => {
  it("starts on city detail with default city", () => {
    const app = createGameApp({ repoRoot });
    const shell = createGameShell(app);
    const nav = shell.getNavigation();
    expect(nav.currentScreen).toBe("screen_city_detail");
    expect(nav.cityId).toBe("CITY-START");
  });

  it("supports navigation stack open/back", () => {
    const app = createGameApp({ repoRoot });
    const shell = createGameShell(app);
    shell.openScreen("screen_company");
    expect(shell.getNavigation().currentScreen).toBe("screen_company");
    shell.back();
    expect(shell.getNavigation().currentScreen).toBe("screen_city_detail");
  });

  it("routes build and advance through modules only", () => {
    const app = createGameApp({ repoRoot });
    const shell = createGameShell(app);
    const build = shell.buildInCurrentCity("wind", 1);
    expect(build.ok).toBe(true);
    const month = shell.advanceMonthInCurrentCity();
    expect(month.ok).toBe(true);
    expect(month.monthTo).toBe(2);
    expect(app.controller.state.currentMonth).toBe(2);
  });
});
