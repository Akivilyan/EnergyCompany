import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { runCocosHudCloseStaticChecks } from "./cocosHudCloseCheck.js";
import { runCocosInitChecks, summarizeCocosInitChecks } from "./cocosInitCheck.js";
import { runClientHudSmoke } from "./clientHudSmoke.js";
import { resolveClientConfigDir, resolveClientSharedDir } from "./clientPaths.js";
import { mountGameClient } from "./gameClientEntry.js";
import { loadConfigRepoFromJsonDir } from "./loadConfigRecords.js";
import type { WxHideLifecyclePort } from "../infra/lifecycle/wxLifecycle.js";
import { InMemoryStateStorage } from "../infra/storage/stateStorage.js";
import { LoggingSceneHost } from "../ui/sceneHost.js";

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

export interface CocosHudCloseResult {
  staticChecks: ReturnType<typeof runCocosHudCloseStaticChecks>;
  smokeSteps: ReturnType<typeof runClientHudSmoke>;
  persistenceOk: boolean;
  persistenceDetail: string;
}

export function runCocosHudClose(
  repoRoot: string,
  options: { withPersistence: boolean; withInitPreflight: boolean }
): CocosHudCloseResult {
  const sharedEntry = path.join(resolveClientSharedDir(repoRoot), "game-client.mjs");
  if (!fs.existsSync(sharedEntry)) {
    execSync("npm run build:client", { stdio: "inherit", cwd: repoRoot });
  }

  const staticChecks = runCocosHudCloseStaticChecks(repoRoot);
  if (options.withInitPreflight) {
    const initSummary = summarizeCocosInitChecks(runCocosInitChecks(repoRoot));
    if (initSummary.blockingFailed.length > 0) {
      throw new Error(`cocos init preflight failed: ${initSummary.blockingFailed.length} blocking`);
    }
  }

  const config = loadConfigRepoFromJsonDir(resolveClientConfigDir(repoRoot));
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

  const smokeSteps = runClientHudSmoke(boot1);
  let persistenceOk = true;
  let persistenceDetail = "skipped";

  if (options.withPersistence) {
    const savedMonth = boot1.app.controller.state.currentMonth;
    const savedFunds = boot1.app.controller.state.funds;
    if (!boot1.clientAutoSave?.bound) {
      return {
        staticChecks,
        smokeSteps,
        persistenceOk: false,
        persistenceDetail: "auto-save on hide was not bound"
      };
    }
    lifecycle.triggerHide();
    boot1.clientAutoSave.unbind();

    const boot2 = mountGameClient({
      configRepo: config,
      sceneHost: host,
      stateStorage: storage,
      wxLifecycle: lifecycle
    });
    if (!boot2.clientResume?.resumed) {
      persistenceOk = false;
      persistenceDetail = "auto-resume failed on remount";
    } else if (
      boot2.app.controller.state.currentMonth !== savedMonth ||
      boot2.app.controller.state.funds !== savedFunds
    ) {
      persistenceOk = false;
      persistenceDetail = "auto-resume did not restore saved run state";
    } else {
      persistenceDetail = `month=${boot2.app.controller.state.currentMonth}, resume=${boot2.clientResume.slotId}`;
    }
  }

  return { staticChecks, smokeSteps, persistenceOk, persistenceDetail };
}
