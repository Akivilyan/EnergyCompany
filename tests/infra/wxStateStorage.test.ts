import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { InMemoryStateStorage } from "../../src/infra/storage/stateStorage.js";
import {
  buildRunSlotStorageKey,
  createClientStateStorage,
  WxStateStorage,
  type WxStorageSyncPort,
  WX_RUN_SLOT_KEY_PREFIX
} from "../../src/infra/storage/wxStateStorage.js";
import { createRunPersistence } from "../../src/modules/runPersistence.js";
import { RunController } from "../../src/modules/runController.js";


class FakeWxStorageSyncPort implements WxStorageSyncPort {
  private readonly slots = new Map<string, unknown>();

  getStorageSync(key: string): unknown {
    return this.slots.has(key) ? this.slots.get(key) : "";
  }

  setStorageSync(key: string, data: unknown): void {
    this.slots.set(key, structuredClone(data));
  }

  removeStorageSync(key: string): void {
    this.slots.delete(key);
  }
}

describe("WxStateStorage", () => {
  it("persists envelope under prefixed wx key", () => {
    const wx = new FakeWxStorageSyncPort();
    const storage = new WxStateStorage(wx);
    const controller = createTestController(repoRoot);
    const persistence = createRunPersistence(controller, storage);
    controller.advanceMonths(1);
    const month = controller.state.currentMonth;

    const save = persistence.save("slot-a");
    expect(save.ok).toBe(true);
    expect(wx.getStorageSync(buildRunSlotStorageKey("slot-a"))).toMatchObject({
      schemaVersion: 1,
      state: { currentMonth: month }
    });

    controller.state.currentMonth = 999;
    const load = persistence.load("slot-a");
    expect(load.ok).toBe(true);
    expect(controller.state.currentMonth).toBe(month);
  });

  it("returns null for missing or malformed wx payload", () => {
    const wx = new FakeWxStorageSyncPort();
    const storage = new WxStateStorage(wx);
    expect(storage.load("missing")).toBeNull();

    wx.setStorageSync(buildRunSlotStorageKey("broken"), { foo: "bar" });
    expect(storage.load("broken")).toBeNull();
  });

  it("remove clears wx slot key", () => {
    const wx = new FakeWxStorageSyncPort();
    const storage = new WxStateStorage(wx);
    storage.save("slot-b", {
      schemaVersion: 1,
      savedAtUnixMs: 1,
      state: createTestController(repoRoot).state
    });
    storage.remove("slot-b");
    expect(storage.load("slot-b")).toBeNull();
  });

  it("createClientStateStorage falls back to memory without wx global", () => {
    const storage = createClientStateStorage();
    expect(storage).toBeInstanceOf(InMemoryStateStorage);
  });

  it("createClientStateStorage prefers explicit override", () => {
    const override = new InMemoryStateStorage();
    expect(createClientStateStorage(override)).toBe(override);
  });

  it("uses custom key prefix when provided", () => {
    const wx = new FakeWxStorageSyncPort();
    const prefix = "test:slot:";
    const storage = new WxStateStorage(wx, { keyPrefix: prefix });
    storage.save("slot-c", {
      schemaVersion: 1,
      savedAtUnixMs: 1,
      state: createTestController(repoRoot).state
    });
    expect(wx.getStorageSync(`${prefix}slot-c`)).not.toBe("");
    expect(wx.getStorageSync(`${WX_RUN_SLOT_KEY_PREFIX}slot-c`)).toBe("");
  });
});
