import {
  worldCycleTargetCandidate,
  worldOpenSelectedTarget,
  worldQueueSelectedTrunk,
  worldQueueSuperHydro,
  worldQueueSuperHydroGridLink,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

export interface WorldActionResult {
  ok: boolean;
  messageKey: string | null;
  errorCode: string | null;
}

export function openSelectedWorldTarget(boot: GameBootstrap): WorldActionResult {
  const out = worldOpenSelectedTarget(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function cycleWorldTarget(boot: GameBootstrap): WorldActionResult {
  const out = worldCycleTargetCandidate(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function queueSelectedWorldTrunk(boot: GameBootstrap): WorldActionResult {
  const out = worldQueueSelectedTrunk(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function queueWorldSuperHydro(boot: GameBootstrap): WorldActionResult {
  const out = worldQueueSuperHydro(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function queueWorldSuperHydroGrid(boot: GameBootstrap): WorldActionResult {
  const out = worldQueueSuperHydroGridLink(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}
