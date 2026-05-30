import type { PersistenceActionResult } from "../ui/gameShell.js";

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

export interface ClientPlayPersistence {
  saveSlot(slotId: string): PersistenceActionResult;
  loadSlot(slotId: string): PersistenceActionResult;
}

export function tryResumeClientRun(
  play: ClientPlayPersistence,
  slotId: string = DEFAULT_CLIENT_RUN_SLOT
): ClientResumeResult {
  const load = play.loadSlot(slotId);
  if (load.ok) {
    return {
      slotId,
      resumed: true,
      errorCode: null,
      savedAtUnixMs: load.savedAtUnixMs
    };
  }
  if (load.errorCode === "not_found") {
    return { slotId, resumed: false, errorCode: null };
  }
  return {
    slotId,
    resumed: false,
    errorCode: load.errorCode,
    savedAtUnixMs: load.savedAtUnixMs
  };
}

export function persistClientRun(
  play: ClientPlayPersistence,
  slotId: string = DEFAULT_CLIENT_RUN_SLOT
): ClientPersistResult {
  const save = play.saveSlot(slotId);
  return {
    slotId,
    ok: save.ok,
    errorCode: save.errorCode,
    savedAtUnixMs: save.savedAtUnixMs
  };
}
