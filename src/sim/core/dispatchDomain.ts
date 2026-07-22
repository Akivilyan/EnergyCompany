import type { ConfigRepo } from "../config/configRepo.js";
import type { Command } from "../types/commands.js";
import type { GameState } from "../types/gameState.js";
import type { SimResult } from "../types/result.js";

export type DispatchCommandOutcome = "unhandled" | "handled" | "handled_subphase";

export type DispatchDomainHandler = (
  state: GameState,
  command: Command,
  config: ConfigRepo
) => SimResult<DispatchCommandOutcome>;
