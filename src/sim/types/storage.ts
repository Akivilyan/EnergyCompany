import type { GameState } from "./gameState.js";

export const STATE_SCHEMA_VERSION = 1;

export interface SerializedStateEnvelope {
  schemaVersion: number;
  savedAtUnixMs: number;
  state: GameState;
}
