import {
  techCancelActiveResearch,
  techCycleResearchCandidate,
  techSpeedupResearchByAdAsync,
  techStartDefaultResearch,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

export interface TechActionResult {
  ok: boolean;
  messageKey: string | null;
  errorCode: string | null;
}

export function startDefaultTechResearch(boot: GameBootstrap): TechActionResult {
  const out = techStartDefaultResearch(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}

export function cancelActiveTechResearch(boot: GameBootstrap): TechActionResult {
  const out = techCancelActiveResearch(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}

export function cycleTechResearchCandidate(boot: GameBootstrap): TechActionResult {
  const out = techCycleResearchCandidate(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}

export async function speedupTechResearchByAd(boot: GameBootstrap): Promise<TechActionResult> {
  const out = await techSpeedupResearchByAdAsync(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}
