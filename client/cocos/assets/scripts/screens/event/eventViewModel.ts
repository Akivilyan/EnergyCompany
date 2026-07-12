import { formatPendingEventModalLines, type GameBootstrap } from "../../../shared/game-client.mjs";

export interface EventModalViewModel {
  active: boolean;
  title: string;
  summary: string;
  impact: string;
  ackKey: string;
}

export function readEventModalViewModel(boot: GameBootstrap | null): EventModalViewModel {
  if (!boot) {
    return { active: false, title: "", summary: "", impact: "", ackKey: "hud.btn.ack_event" };
  }
  const pending = formatPendingEventModalLines(boot);
  if (!pending) {
    return { active: false, title: "", summary: "", impact: "", ackKey: "hud.btn.ack_event" };
  }
  return {
    active: true,
    title: pending.title,
    summary: pending.summary,
    impact: pending.impact,
    ackKey: pending.ackKey
  };
}
