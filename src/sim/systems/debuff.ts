import type { DisasterConfig } from "../config/configRepo.js";
import type { ConfigRepo } from "../config/configRepo.js";
import type { ActiveDebuff, GameState } from "../types/gameState.js";
import { getDisasterPenalty } from "../core/technologyEffects.js";

export function aggregateIncomeMult(state: GameState): { num: number; den: number } {
  if (state.activeDebuffs.length === 0) {
    return { num: 1, den: 1 };
  }
  let num = 1;
  let den = 1;
  for (const d of state.activeDebuffs) {
    num *= d.incomeMultNum;
    den *= d.incomeMultDen;
  }
  return { num, den };
}

export function tickDebuffs(state: GameState): void {
  state.activeDebuffs = state.activeDebuffs
    .map((d) => ({ ...d, monthsRemaining: d.monthsRemaining - 1 }))
    .filter((d) => d.monthsRemaining > 0);
}

export function applyDisasterTrigger(
  state: GameState,
  config: ConfigRepo,
  disaster: DisasterConfig,
  cashMult: number
): number {
  const basePenalty = Math.floor(disaster.immediate_cash_penalty * cashMult);
  const penalty = getDisasterPenalty(state, config, basePenalty);
  state.funds -= penalty;
  state.disastersTriggered.push(disaster.seq);
  const debuff: ActiveDebuff = {
    disasterSeq: disaster.seq,
    monthsRemaining: disaster.debuff_duration_months,
    incomeMultNum: disaster.income_mult_num,
    incomeMultDen: disaster.income_mult_den,
    buildDurationMultNum: disaster.build_duration_mult_num,
    buildDurationMultDen: disaster.build_duration_mult_den,
    researchDurationMultNum: disaster.research_duration_mult_num,
    researchDurationMultDen: disaster.research_duration_mult_den
  };
  state.activeDebuffs.push(debuff);
  return penalty;
}
