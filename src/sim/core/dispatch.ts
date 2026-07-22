import type { ConfigRepo } from "../config/configRepo.js";
import type { Command } from "../types/commands.js";
import type { GameState } from "../types/gameState.js";
import type { SimPorts } from "../types/ports.js";
import { err, ok, type SimResult } from "../types/result.js";
import { deepClone } from "./deepClone.js";
import type { DispatchDomainHandler } from "./dispatchDomain.js";
import { handleInfrastructureCommand } from "./dispatchInfrastructure.js";
import { handleMetaCommand } from "./dispatchMeta.js";
import { handleProgressionCommand } from "./dispatchProgression.js";

export interface DispatchOutput {
  state: GameState;
}

const DOMAIN_HANDLERS: DispatchDomainHandler[] = [
  handleInfrastructureCommand,
  handleProgressionCommand,
  handleMetaCommand
];

function isBlockedAllowedCommand(command: Command): boolean {
  return command.type === "advance_onboarding" || command.type === "skip_onboarding";
}

export function dispatch(
  state: GameState,
  command: Command,
  config: ConfigRepo,
  _ports: SimPorts
): SimResult<DispatchOutput> {
  if (state.phase !== "run_playable" || state.runResult !== null) {
    return err("invalid_phase", "commands only allowed in run_playable without result", {
      phase: state.phase,
      run_result: state.runResult ?? "null",
      playable_sub_phase: state.playableSubPhase ?? "null",
      command_type: command.type
    });
  }
  if (state.playableSubPhase === null) {
    return err("state_invariant_broken", "playableSubPhase must not be null in run_playable");
  }
  if (state.playableSubPhase === "blocked" && !isBlockedAllowedCommand(command)) {
    return err("blocked_by_tutorial", "commands are blocked by tutorial gate", {
      playable_sub_phase: state.playableSubPhase,
      blocked_command: command.type,
      allowed_commands_csv: "advance_onboarding,skip_onboarding"
    });
  }
  if (state.adsRemaining < 0) {
    return err("state_invariant_broken", "adsRemaining must be >= 0", {
      ads_remaining: state.adsRemaining
    });
  }

  const next: GameState = deepClone(state);
  for (const handler of DOMAIN_HANDLERS) {
    const result = handler(next, command, config);
    if (!result.ok) return result;
    if (result.value === "unhandled") continue;
    if (result.value !== "handled_subphase") next.playableSubPhase = "navigating";
    return ok({ state: next });
  }

  return err("invalid_command_payload", "unknown command");
}
