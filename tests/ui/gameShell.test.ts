import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGameAppFromRepo } from "../../src/app/gameApp.node.js";
import { createGameShell } from "../../src/ui/gameShell.js";


describe("GameShell", () => {
  it("starts on city detail with default city", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    const nav = shell.getNavigation();
    expect(nav.currentScreen).toBe("screen_city_detail");
    expect(nav.cityId).toBe("CITY-START");
  });

  it("supports navigation stack open/back", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    shell.openScreen("screen_company");
    expect(shell.getNavigation().currentScreen).toBe("screen_company");
    shell.back();
    expect(shell.getNavigation().currentScreen).toBe("screen_city_detail");
  });

  it("switches primary tabs without growing the back stack", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    shell.openScreen("screen_company");
    shell.openScreen("screen_tech_tree");
    shell.openScreen("screen_region");
    shell.openScreen("screen_company");
    expect(shell.getNavigation().currentScreen).toBe("screen_company");
    expect(shell.getNavigation().stack).toEqual([]);
    shell.back();
    expect(shell.getNavigation().currentScreen).toBe("screen_city_detail");
    expect(shell.getNavigation().stack).toEqual([]);
  });

  it("routes build and advance through modules only", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    const build = shell.buildInCurrentCity("wind", 1);
    expect(build.ok).toBe(true);
    const month = shell.advanceMonthInCurrentCity();
    expect(month.ok).toBe(true);
    expect(month.monthTo).toBe(2);
    expect(app.controller.state.currentMonth).toBe(2);
  });

  it("save and load slot through persistence", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    shell.advanceMonthInCurrentCity();
    const save = shell.saveSlot("slot-test");
    expect(save.ok).toBe(true);
    expect(save.savedAtUnixMs).toBeTypeOf("number");

    app.controller.state.funds = -999;
    const load = shell.loadSlot("slot-test");
    expect(load.ok).toBe(true);
    expect(app.controller.state.funds).toBeGreaterThan(0);
  });
});
