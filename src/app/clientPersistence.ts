import type { RunPersistence } from "../modules/runPersistence.js";

export const DEFAULT_CLIENT_RUN_SLOT = "slot-main";

export interface ClientResumeResult {
  slotId: string;
  resumed: boolean;
  errorCode: string | null;
  savedAtUnixMs?: number;
}

export interface ClientPersistResult {
  slotId: string;
  ok: boolean;
  errorCode: string | null;
  savedAtUnixMs?: number;
}

export function tryResumeClientRun(
  persistence: RunPersistence,
  slotId: string = DEFAULT_CLIENT_RUN_SLOT
): ClientResumeResult {
  const load = persistence.load(slotId);
  if (load.ok) {
    return {
      slotId,
      resumed: true,
      errorCode: null,
      savedAtUnixMs: load.value.envelope.savedAtUnixMs
    };
  }
  if (load.error === "not_found") {
    return { slotId, resumed: false, errorCode: null };
  }
  return {
    slotId,
    resumed: false,
    errorCode: load.error
  };
}

export function persistClientRun(
  persistence: RunPersistence,
  slotId: string = DEFAULT_CLIENT_RUN_SLOT
): ClientPersistResult {
  const save = persistence.save(slotId);
  return {
    slotId,
    ok: save.ok,
    errorCode: save.ok ? null : save.error,
    savedAtUnixMs: save.ok ? save.value.envelope.savedAtUnixMs : undefined
  };
}
