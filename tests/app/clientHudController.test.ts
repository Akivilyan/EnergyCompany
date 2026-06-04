import { beforeEach, describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { formatClientHudStatus } from "../../src/app/clientHudController.js";
import {
  clientNavOpenCompany,
  clientNavOpenRegion,
  clientNavOpenTechTree
} from "../../src/app/screenNavController.js";
import { techEnsureLevelIIForDev } from "../../src/app/techHudController.js";
import { DEFAULT_LOCALE, setLocale } from "../../src/i18n/index.js";

describe("clientHudController", () => {
  beforeEach(() => {
    setLocale(DEFAULT_LOCALE);
  });

  it("formats city status by default (zh-CN)", () => {
    const boot = createGameBootstrapFromRepo();
    expect(formatClientHudStatus(boot)).toMatch(/第\d+月 · 资金\d+ · 起始城/);
  });

  it("formats company snapshot when on screen_company", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    expect(formatClientHudStatus(boot)).toMatch(/^公司 · \d+级 · 资金\d+ · 广告\d+次$/);
  });

  it("formats tech tree when on screen_tech_tree", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenTechTree(boot);
    const line = formatClientHudStatus(boot);
    expect(line.startsWith("科技 ·")).toBe(true);
  });

  it("formats region when on screen_region", () => {
    const boot = createGameBootstrapFromRepo();
    techEnsureLevelIIForDev(boot);
    clientNavOpenRegion(boot);
    expect(formatClientHudStatus(boot)).toMatch(/^区域 · 2级 · 资金\d+ · 已解锁\d+城$/);
  });
});
