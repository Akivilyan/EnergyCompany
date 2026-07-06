import { eventsAcknowledgeNextPending, type GameBootstrap } from "../../shared/game-client.mjs";

export interface EventActionResult {
  ok: boolean;
  messageKey: string | null;
  errorCode: string | null;
}

export function acknowledgePendingEvent(boot: GameBootstrap): EventActionResult {
  const out = eventsAcknowledgeNextPending(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.uiErrorCode };
}
