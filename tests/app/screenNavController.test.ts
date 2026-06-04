import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, setLocale } from "../../src/i18n/index.js";
import { runCocosInitChecks, summarizeCocosInitChecks } from "../../src/app/cocosInitCheck.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import {
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenTechTree,
  formatClientNavHint
} from "../../src/app/screenNavController.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";


describe("screenNavController", () => {
  beforeEach(() => {
    setLocale(DEFAULT_LOCALE);
  });

  it("opens company and tech screens through play surface", () => {
    const config = loadTestConfig();
    const host = new LoggingSceneHost();
    const boot = mountGameClient({ configRepo: config, sceneHost: host, autoResumeSlot: false });

    const company = clientNavOpenCompany(boot);
    expect(company.screen).toBe("screen_company");
    expect(host.getCurrentScene()).toBe("Company");

    const tech = clientNavOpenTechTree(boot);
    expect(tech.screen).toBe("screen_tech_tree");
    expect(host.getCurrentScene()).toBe("TechTree");
    expect(tech.navigation.stack).toContain("screen_company");
  });

  it("navigates back to city detail", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({
      configRepo: config,
      sceneHost: new LoggingSceneHost(),
      autoResumeSlot: false
    });
    clientNavOpenCompany(boot);
    const back = clientNavBack(boot);
    expect(back.screen).toBe("screen_city_detail");
    expect(formatClientNavHint(back.view, back.navigation.stack.length)).toContain("返回层0");
  });
});

describe("cocosInitCheck", () => {
  it("passes blocking checks for synced client assets", () => {
    const checks = runCocosInitChecks(repoRoot);
    const summary = summarizeCocosInitChecks(checks);
    expect(summary.blockingFailed).toEqual([]);
  });
});
