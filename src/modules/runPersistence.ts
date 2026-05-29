import { deserializeState, serializeState, type SimResult } from "../sim/index.js";
import type { SerializedStateEnvelope } from "../sim/types/storage.js";
import type { StateStorage } from "../infra/storage/stateStorage.js";
import type { RunController } from "./runController.js";

export interface SaveStateResult {
  slotId: string;
  envelope: SerializedStateEnvelope;
}

export interface LoadStateResult {
  slotId: string;
  envelope: SerializedStateEnvelope;
}

export class RunPersistence {
  constructor(
    private readonly controller: RunController,
    private readonly storage: StateStorage
  ) {}

  save(slotId: string): SimResult<SaveStateResult> {
    const saved = serializeState(this.controller.state);
    if (!saved.ok) return saved;
    this.storage.save(slotId, saved.value);
    return {
      ok: true,
      value: {
        slotId,
        envelope: saved.value
      }
    };
  }

  load(slotId: string): SimResult<LoadStateResult> {
    const envelope = this.storage.load(slotId);
    if (!envelope) {
      return {
        ok: false,
        error: "not_found",
        message: "save slot not found",
        context: { slot_id: slotId }
      };
    }
    const loaded = deserializeState(envelope, this.controller.config);
    if (!loaded.ok) return loaded;
    this.controller.state = loaded.value;
    return {
      ok: true,
      value: {
        slotId,
        envelope
      }
    };
  }

  remove(slotId: string): void {
    this.storage.remove(slotId);
  }
}

export function createRunPersistence(
  controller: RunController,
  storage: StateStorage
): RunPersistence {
  return new RunPersistence(controller, storage);
}
