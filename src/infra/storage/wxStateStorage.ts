import type { SerializedStateEnvelope } from "../../sim/types/storage.js";
import { InMemoryStateStorage, type StateStorage } from "./stateStorage.js";

export const WX_RUN_SLOT_KEY_PREFIX = "ec:run-slot:";

/** 微信 `wx.*StorageSync` 最小端口，便于单测注入 fake。 */
export interface WxStorageSyncPort {
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, data: unknown): void;
  removeStorageSync(key: string): void;
}

export interface WxStateStorageOptions {
  keyPrefix?: string;
}

export function buildRunSlotStorageKey(
  slotId: string,
  keyPrefix: string = WX_RUN_SLOT_KEY_PREFIX
): string {
  return `${keyPrefix}${slotId}`;
}

function isSerializedStateEnvelope(value: unknown): value is SerializedStateEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as SerializedStateEnvelope;
  return (
    typeof candidate.schemaVersion === "number" &&
    typeof candidate.savedAtUnixMs === "number" &&
    typeof candidate.state === "object" &&
    candidate.state !== null
  );
}

export class WxStateStorage implements StateStorage {
  private readonly keyPrefix: string;

  constructor(
    private readonly wx: WxStorageSyncPort,
    options: WxStateStorageOptions = {}
  ) {
    this.keyPrefix = options.keyPrefix ?? WX_RUN_SLOT_KEY_PREFIX;
  }

  save(slotId: string, envelope: SerializedStateEnvelope): void {
    this.wx.setStorageSync(this.storageKey(slotId), envelope);
  }

  load(slotId: string): SerializedStateEnvelope | null {
    const raw = this.wx.getStorageSync(this.storageKey(slotId));
    if (raw == null || raw === "") return null;
    if (!isSerializedStateEnvelope(raw)) return null;
    return structuredClone(raw);
  }

  remove(slotId: string): void {
    this.wx.removeStorageSync(this.storageKey(slotId));
  }

  private storageKey(slotId: string): string {
    return buildRunSlotStorageKey(slotId, this.keyPrefix);
  }
}

export function resolveWxStorageSyncPort(): WxStorageSyncPort | null {
  const candidate = (globalThis as { wx?: Partial<WxStorageSyncPort> }).wx;
  if (!candidate) return null;
  const { getStorageSync, setStorageSync, removeStorageSync } = candidate;
  if (
    typeof getStorageSync !== "function" ||
    typeof setStorageSync !== "function" ||
    typeof removeStorageSync !== "function"
  ) {
    return null;
  }
  return candidate as WxStorageSyncPort;
}

/** 客户端默认存档：微信环境走 wx 本地存储，否则回退内存（Node 冒烟/单测）。 */
export function createClientStateStorage(override?: StateStorage): StateStorage {
  if (override) return override;
  const wx = resolveWxStorageSyncPort();
  if (wx) return new WxStateStorage(wx);
  return new InMemoryStateStorage();
}
