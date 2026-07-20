import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLIENT_RUN_SLOT,
  persistClientRun,
  tryResumeClientRun
} from "../../src/app/clientPersistence.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import { createGameAppFromRepo } from "../../src/app/gameApp.node.js";
import { InMemoryStateStorage } from "../../src/infra/storage/stateStorage.js";
import { loadTestConfig, repoRoot } from "../helpers/testRepo.js";

describe("clientPersistence", () => {
  it("saves and resumes the default slot through RunPersistence", () => {
    const app = createGameAppFromRepo({ repoRoot });
    app.screens.city("CITY-START").advanceOneMonth();
    const month = app.controller.state.currentMonth;

    const saved = persistClientRun(app.persistence);
    expect(saved.ok).toBe(true);
    expect(saved.slotId).toBe(DEFAULT_CLIENT_RUN_SLOT);

    app.controller.state.currentMonth = 99;
    const resumed = tryResumeClientRun(app.persistence);
    expect(resumed.resumed).toBe(true);
    expect(app.controller.state.currentMonth).toBe(month);
  });

  it("treats a missing slot as a fresh start", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const resumed = tryResumeClientRun(app.persistence);
    expect(resumed.resumed).toBe(false);
    expect(resumed.errorCode).toBeNull();
  });

  it("resumes the default slot on remount when storage is shared", () => {
    const config = loadTestConfig();
    const storage = new InMemoryStateStorage();
    const first = mountGameClient({
      configRepo: config,
      stateStorage: storage,
      autoResumeSlot: false,
      autoSaveOnHide: false
    });
    first.app.screens.city("CITY-START").queueConstruction("wind", 1);
    first.app.screens.city("CITY-START").advanceOneMonth();
    const month = first.app.controller.state.currentMonth;
    persistClientRun(first.app.persistence);

    const second = mountGameClient({
      configRepo: config,
      stateStorage: storage,
      autoSaveOnHide: false
    });
    expect(second.clientResume?.resumed).toBe(true);
    expect(second.app.controller.state.currentMonth).toBe(month);
  });
});
