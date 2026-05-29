import type { SerializedStateEnvelope } from "../../sim/types/storage.js";

export interface StateStorage {
  save(slotId: string, envelope: SerializedStateEnvelope): void;
  load(slotId: string): SerializedStateEnvelope | null;
  remove(slotId: string): void;
}

export class InMemoryStateStorage implements StateStorage {
  private readonly slots = new Map<string, SerializedStateEnvelope>();

  save(slotId: string, envelope: SerializedStateEnvelope): void {
    this.slots.set(slotId, structuredClone(envelope));
  }

  load(slotId: string): SerializedStateEnvelope | null {
    const value = this.slots.get(slotId);
    if (!value) return null;
    return structuredClone(value);
  }

  remove(slotId: string): void {
    this.slots.delete(slotId);
  }
}
