import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLIENT_RUN_SLOT,
  persistClientRun,
  tryResumeClientRun
} from "../../src/app/clientPersistence.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import { InMemoryStateStorage } from "../../src/infra/storage/stateStorage.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import { createGameShell } from "../../src/ui/gameShell.js";
import { createGameAppFromRepo } from "../../src/app/gameApp.node.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";


describe("clientPersistence", () => {
  it("persistClientRun saves default slot through GameShell", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    shell.advanceMonthInCurrentCity();
    const month = app.controller.state.currentMonth;
    const out = persistClientRun(shell);
    expect(out.ok).toBe(true);
    expect(out.slotId).toBe(DEFAULT_CLIENT_RUN_SLOT);
    expect(out.savedAtUnixMs).toBeTypeOf("number");

    app.controller.state.currentMonth = 99;
    const resume = tryResumeClientRun(shell);
    expect(resume.resumed).toBe(true);
    expect(app.controller.state.currentMonth).toBe(month);
  });

  it("tryResumeClientRun treats missing slot as fresh start", () => {
    const app = createGameAppFromRepo({ repoRoot });
    const shell = createGameShell(app);
    const resume = tryResumeClientRun(shell);
    expect(resume.resumed).toBe(false);
    expect(resume.errorCode).toBeNull();
  });
});

describe("mountGameClient auto resume", () => {
  it("resumes default slot on remount when storage is shared", () => {
    const config = loadTestConfig();
    const storage = new InMemoryStateStorage();
    const host = new LoggingSceneHost();

    const boot1 = mountGameClient({
      configRepo: config,
      sceneHost: host,
      stateStorage: storage,
      autoResumeSlot: false
    });
    boot1.play.buildInCurrentCity("wind", 1);
    boot1.play.advanceMonthInCurrentCity();
    const month = boot1.app.controller.state.currentMonth;
    const funds = boot1.app.controller.state.funds;
    const save = persistClientRun(boot1.play);
    expect(save.ok).toBe(true);

    const boot2 = mountGameClient({
      configRepo: config,
      sceneHost: host,
      stateStorage: storage
    });
    expect(boot2.clientResume?.resumed).toBe(true);
    expect(boot2.clientResume?.slotId).toBe(DEFAULT_CLIENT_RUN_SLOT);
    expect(boot2.app.controller.state.currentMonth).toBe(month);
    expect(boot2.app.controller.state.funds).toBe(funds);
  });
});
