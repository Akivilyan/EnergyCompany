import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { runCocosHudCloseStaticChecks } from "./cocosHudCloseCheck.js";
import { runCocosInitChecks, summarizeCocosInitChecks } from "./cocosInitCheck.js";
import { runClientHudSmoke } from "./clientHudSmoke.js";
import { resolveClientConfigDir, resolveClientSharedDir } from "./clientPaths.js";
import { eventsAcknowledgeNextPending } from "./eventsHudController.js";
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
  eventResumeOk: boolean;
  eventResumeDetail: string;
}

interface PersistenceSmokeResult {
  ok: boolean;
  detail: string;
}

export function runCocosHudClose(
  repoRoot: string,
  options: {
    withPersistence: boolean;
    withInitPreflight: boolean;
    withWechatBuildFreshness?: boolean;
  }
): CocosHudCloseResult {
  const sharedEntry = path.join(resolveClientSharedDir(repoRoot), "game-client.mjs");
  if (!fs.existsSync(sharedEntry)) {
    execSync("npm run build:client", { stdio: "inherit", cwd: repoRoot });
  }

  const staticChecks = runCocosHudCloseStaticChecks(repoRoot, {
    withWechatBuildFreshness: options.withWechatBuildFreshness ?? false
  });
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
  let eventResumeOk = true;
  let eventResumeDetail = "skipped";

  if (options.withPersistence) {
    const persistence = runBasicPersistenceSmoke(config);
    persistenceOk = persistence.ok;
    persistenceDetail = persistence.detail;

    const eventResume = runPendingEventResumeSmoke(config);
    eventResumeOk = eventResume.ok;
    eventResumeDetail = eventResume.detail;
  }

  return {
    staticChecks,
    smokeSteps,
    persistenceOk,
    persistenceDetail,
    eventResumeOk,
    eventResumeDetail
  };
}

function runBasicPersistenceSmoke(config: ReturnType<typeof loadConfigRepoFromJsonDir>): PersistenceSmokeResult {
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
  const savedMonth = boot1.app.controller.state.currentMonth;
  const savedFunds = boot1.app.controller.state.funds;
  const hidden = hideAndRemount(config, storage, host, lifecycle, boot1);
  if (!hidden.ok) return hidden;

  const boot2 = hidden.boot;
  if (
    boot2.app.controller.state.currentMonth !== savedMonth ||
    boot2.app.controller.state.funds !== savedFunds
  ) {
    return { ok: false, detail: "auto-resume did not restore saved run state" };
  }
  return {
    ok: true,
    detail: `month=${boot2.app.controller.state.currentMonth}, resume=${boot2.clientResume?.slotId ?? "none"}`
  };
}

function runPendingEventResumeSmoke(config: ReturnType<typeof loadConfigRepoFromJsonDir>): PersistenceSmokeResult {
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

  boot1.app.controller.state.funds = 10000;
  while (
    !boot1.app.screens.events.getSnapshot().pendingFullscreen &&
    boot1.app.controller.state.currentMonth < 30 &&
    boot1.app.controller.state.runResult === null
  ) {
    const advance = boot1.play.advanceMonthInCurrentCity();
    if (!advance.ok) {
      return {
        ok: false,
        detail: `failed to reach pending event: ${advance.errorCode ?? "unknown"}`
      };
    }
  }

  const pendingBefore = boot1.app.screens.events.getSnapshot().pendingFullscreen;
  if (!pendingBefore) {
    return { ok: false, detail: "pending event was not reached before hide" };
  }

  const hidden = hideAndRemount(config, storage, host, lifecycle, boot1);
  if (!hidden.ok) return hidden;

  const boot2 = hidden.boot;
  const pendingAfter = boot2.app.screens.events.getSnapshot().pendingFullscreen;
  if (pendingAfter?.seq !== pendingBefore.seq) {
    return {
      ok: false,
      detail: `pending event changed after resume: before=${pendingBefore.seq}, after=${pendingAfter?.seq ?? "none"}`
    };
  }

  const ack = eventsAcknowledgeNextPending(boot2);
  if (!ack.ok) {
    return {
      ok: false,
      detail: `pending event could not be acknowledged after resume: ${ack.uiErrorCode ?? "unknown"}`
    };
  }
  return {
    ok: true,
    detail: `seq=${pendingBefore.seq}, month=${boot2.app.controller.state.currentMonth}, acked=${boot2.app.controller.state.acknowledgedDisasterSeqs.length}`
  };
}

function hideAndRemount(
  config: ReturnType<typeof loadConfigRepoFromJsonDir>,
  storage: InMemoryStateStorage,
  host: LoggingSceneHost,
  lifecycle: FakeWxHideLifecycle,
  boot: ReturnType<typeof mountGameClient>
):
  | { ok: true; boot: ReturnType<typeof mountGameClient> }
  | { ok: false; detail: string } {
  if (!boot.clientAutoSave?.bound) {
    return { ok: false, detail: "auto-save on hide was not bound" };
  }
  lifecycle.triggerHide();
  boot.clientAutoSave.unbind();

  const remounted = mountGameClient({
    configRepo: config,
    sceneHost: host,
    stateStorage: storage,
    wxLifecycle: lifecycle
  });
  if (!remounted.clientResume?.resumed) {
    return { ok: false, detail: "auto-resume failed on remount" };
  }
  return { ok: true, boot: remounted };
}
