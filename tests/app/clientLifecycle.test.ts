import { describe, expect, it } from "vitest";
import { bindClientAutoSaveOnHide } from "../../src/app/clientLifecycle.js";
import { tryResumeClientRun } from "../../src/app/clientPersistence.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import { createGameAppFromRepo } from "../../src/app/gameApp.node.js";
import type { WxHideLifecyclePort } from "../../src/infra/lifecycle/wxLifecycle.js";
import { InMemoryStateStorage } from "../../src/infra/storage/stateStorage.js";
import { loadTestConfig, repoRoot } from "../helpers/testRepo.js";

class FakeWxHideLifecycle implements WxHideLifecyclePort {
  private listeners: Array<() => void> = [];

  onHide(listener: () => void): void {
    this.listeners.push(listener);
  }

  offHide(listener: () => void): void {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }

  triggerHide(): void {
    for (const listener of this.listeners) listener();
  }
}

describe("bindClientAutoSaveOnHide", () => {
  it("persists the default slot when hide fires", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const lifecycle = new FakeWxHideLifecycle();
    app.screens.city("CITY-START").advanceOneMonth();
    const month = app.controller.state.currentMonth;

    const binding = bindClientAutoSaveOnHide(app.persistence, { lifecycle });
    lifecycle.triggerHide();
    app.controller.state.currentMonth = 99;

    expect(binding.bound).toBe(true);
    expect(tryResumeClientRun(app.persistence).resumed).toBe(true);
    expect(app.controller.state.currentMonth).toBe(month);
  });

  it("returns unbound when the lifecycle port is missing", () => {
    const app = createGameAppFromRepo({ repoRoot });
    expect(bindClientAutoSaveOnHide(app.persistence, { lifecycle: null }).bound).toBe(false);
  });

  it("resumes after wx.onHide auto-save and remount", () => {
    const config = loadTestConfig();
    const storage = new InMemoryStateStorage();
    const lifecycle = new FakeWxHideLifecycle();
    const first = mountGameClient({
      configRepo: config,
      stateStorage: storage,
      autoResumeSlot: false,
      wxLifecycle: lifecycle
    });
    first.app.screens.city("CITY-START").advanceOneMonth();
    const month = first.app.controller.state.currentMonth;
    lifecycle.triggerHide();
    first.clientAutoSave?.unbind();

    const second = mountGameClient({
      configRepo: config,
      stateStorage: storage,
      wxLifecycle: lifecycle
    });
    expect(second.clientResume?.resumed).toBe(true);
    expect(second.app.controller.state.currentMonth).toBe(month);
  });
});
