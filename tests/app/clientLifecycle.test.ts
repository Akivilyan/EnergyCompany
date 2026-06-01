import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bindClientAutoSaveOnHide } from "../../src/app/clientLifecycle.js";
import {
  DEFAULT_CLIENT_RUN_SLOT,
  tryResumeClientRun
} from "../../src/app/clientPersistence.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import type { WxHideLifecyclePort } from "../../src/infra/lifecycle/wxLifecycle.js";
import { InMemoryStateStorage } from "../../src/infra/storage/stateStorage.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import { createGameAppFromRepo } from "../../src/app/gameApp.node.js";
import { createGameShell } from "../../src/ui/gameShell.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";


class FakeWxHideLifecycle implements WxHideLifecyclePort {
  private listeners: Array<() => void> = [];

  onHide(listener: () => void): void {
    this.listeners.push(listener);
  }

  offHide(listener: () => void): void {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }

  triggerHide(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

describe("bindClientAutoSaveOnHide", () => {
  it("persists default slot when hide lifecycle fires", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    const lifecycle = new FakeWxHideLifecycle();
    shell.advanceMonthInCurrentCity();
    const month = app.controller.state.currentMonth;

    const binding = bindClientAutoSaveOnHide(shell, { lifecycle });
    expect(binding.bound).toBe(true);
    expect(binding.slotId).toBe(DEFAULT_CLIENT_RUN_SLOT);

    lifecycle.triggerHide();
    app.controller.state.currentMonth = 99;
    const resume = tryResumeClientRun(shell);
    expect(resume.resumed).toBe(true);
    expect(app.controller.state.currentMonth).toBe(month);
  });

  it("returns unbound when lifecycle port is missing", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    const binding = bindClientAutoSaveOnHide(shell, { lifecycle: null });
    expect(binding.bound).toBe(false);
  });

  it("unbind stops hide-triggered saves", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    const lifecycle = new FakeWxHideLifecycle();
    const binding = bindClientAutoSaveOnHide(shell, { lifecycle });
    binding.unbind();

    shell.advanceMonthInCurrentCity();
    lifecycle.triggerHide();
    expect(tryResumeClientRun(shell).resumed).toBe(false);
  });
});

describe("mountGameClient auto save on hide", () => {
  it("resumes after wx.onHide auto-save and remount", () => {
    const config = loadTestConfig();
    const storage = new InMemoryStateStorage();
    const host = new LoggingSceneHost();
    const lifecycle = new FakeWxHideLifecycle();

    const boot1 = mountGameClient({
      configRepo: config,
      sceneHost: host,
      stateStorage: storage,
      autoResumeSlot: false,
      wxLifecycle: lifecycle
    });
    boot1.play.buildInCurrentCity("wind", 1);
    boot1.play.advanceMonthInCurrentCity();
    const month = boot1.app.controller.state.currentMonth;
    const funds = boot1.app.controller.state.funds;
    expect(boot1.clientAutoSave?.bound).toBe(true);

    lifecycle.triggerHide();
    boot1.clientAutoSave?.unbind();

    const boot2 = mountGameClient({
      configRepo: config,
      sceneHost: host,
      stateStorage: storage,
      wxLifecycle: lifecycle
    });
    expect(boot2.clientResume?.resumed).toBe(true);
    expect(boot2.app.controller.state.currentMonth).toBe(month);
    expect(boot2.app.controller.state.funds).toBe(funds);
  });
});
