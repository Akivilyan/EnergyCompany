import type { GameState, SimResult } from "../sim/index.js";
import { getResearchCost, getResearchMonths } from "../sim/index.js";
import type { TechnologyTab } from "../sim/config/configRepo.js";
import type { RewardedAdProvider } from "../infra/monetization/rewardedAdProvider.js";
import {
  createDefaultAdRewardService,
  createAdRewardService,
  type AdRewardService,
  type AdRewardUiErrorCode
} from "./adRewardService.js";
import type { RunController } from "./runController.js";

export type TechTreeUiErrorCode =
  | "tech_locked"
  | "insufficient_funds"
  | "research_queue_full"
  | "research_not_found"
  | "no_active_research"
  | "ad_not_completed"
  | "ad_provider_failed"
  | "action_blocked"
  | "action_invalid"
  | "action_failed";

export interface TechTreeUiCopySpec {
  messageKey: string;
  actionKey: string;
}

export const TECH_TREE_UI_COPY: Record<TechTreeUiErrorCode, TechTreeUiCopySpec> = {
  tech_locked: {
    messageKey: "tech_tree.error.tech_locked",
    actionKey: "tech_tree.action.go_company_upgrade"
  },
  insufficient_funds: {
    messageKey: "tech_tree.error.insufficient_funds",
    actionKey: "tech_tree.action.go_finance"
  },
  research_queue_full: {
    messageKey: "tech_tree.error.research_queue_full",
    actionKey: "tech_tree.action.cancel_or_wait"
  },
  research_not_found: {
    messageKey: "tech_tree.error.research_not_found",
    actionKey: "tech_tree.action.refresh_list"
  },
  no_active_research: {
    messageKey: "tech_tree.error.no_active_research",
    actionKey: "tech_tree.action.start_research_first"
  },
  ad_not_completed: {
    messageKey: "tech_tree.error.ad_not_completed",
    actionKey: "tech_tree.action.retry_ad"
  },
  ad_provider_failed: {
    messageKey: "tech_tree.error.ad_provider_failed",
    actionKey: "tech_tree.action.retry_ad"
  },
  action_blocked: {
    messageKey: "tech_tree.error.action_blocked",
    actionKey: "tech_tree.action.follow_tutorial"
  },
  action_invalid: {
    messageKey: "tech_tree.error.action_invalid",
    actionKey: "tech_tree.action.retry_after_settle"
  },
  action_failed: {
    messageKey: "tech_tree.error.action_failed",
    actionKey: "tech_tree.action.retry"
  }
};

export function resolveTechTreeUiCopy(
  uiErrorCode: TechTreeUiErrorCode | null
): TechTreeUiCopySpec | null {
  if (!uiErrorCode) return null;
  return TECH_TREE_UI_COPY[uiErrorCode];
}

export interface TechTreeSnapshot {
  month: number;
  companyLevel: number;
  funds: number;
  canOpen: boolean;
  technologies: TechTreeNodeSnapshot[];
  researchableTechIds: string[];
  activeResearch: {
    techId: string;
    researchId: string;
    monthsRemaining: number;
  } | null;
  litTechIds: string[];
}

export interface TechTreeNodeSnapshot {
  techId: string;
  displayName: string;
  tab: TechnologyTab;
  companyLevelMin: number;
  status: "locked" | "unlocked" | "researching" | "lit";
  requiresLit: string[];
  researchCost: number;
  researchMonths: number;
  effectSummary: string;
}

export interface TechTreeActionOutput {
  before: TechTreeSnapshot;
  after: TechTreeSnapshot;
  result: SimResult<{ state: GameState }>;
  uiErrorCode: TechTreeUiErrorCode | null;
  uiCopy: TechTreeUiCopySpec | null;
}

function mapUiError(result: TechTreeActionOutput["result"]): TechTreeUiErrorCode | null {
  if (result.ok) return null;
  if (result.error === "not_unlocked") return "tech_locked";
  if (result.error === "insufficient_funds") return "insufficient_funds";
  if (result.error === "not_found") return "research_not_found";
  if (result.error === "blocked_by_tutorial") return "action_blocked";
  if (result.error === "invalid_phase" || result.error === "invalid_command_payload") {
    return "action_invalid";
  }
  if (result.error === "conflict_in_progress") {
    if (result.message.includes("no active research")) return "no_active_research";
    if (result.message.includes("no ads remaining")) return "action_failed";
    return "research_queue_full";
  }
  return "action_failed";
}

function syntheticAdBlockedResult(message: string): SimResult<{ state: GameState }> {
  return {
    ok: false,
    error: "invalid_command_payload",
    message
  };
}

function mapAdUiError(
  adError: AdRewardUiErrorCode | null,
  claimResult: SimResult<{ state: GameState }> | null
): TechTreeUiErrorCode | null {
  if (adError === "ad_not_completed") return "ad_not_completed";
  if (adError === "ad_provider_failed") return "ad_provider_failed";
  if (adError === "reward_rejected" && claimResult) {
    return mapUiError(claimResult);
  }
  return "action_failed";
}

function readNumberEffect(tech: { effect_value: Record<string, unknown> }, key: string): number | null {
  const value = tech.effect_value[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function formatTechEffectSummary(tech: {
  effect_type: string;
  effect_target: string;
  effect_value: Record<string, unknown>;
}): string {
  if (tech.effect_type === "facility_tier") {
    const tierMax = readNumberEffect(tech, "tier_max");
    return tierMax === null ? "facility tier unlock" : `${tech.effect_target} tier <= ${tierMax}`;
  }
  if (tech.effect_type === "eco_sync") {
    return tech.effect_target === "all_thermal"
      ? "thermal facilities become eco"
      : tech.effect_target === "all_nuclear"
        ? "nuclear facilities become eco"
        : `${tech.effect_target} become eco`;
  }
  if (tech.effect_type === "strategic_project") {
    const slotCount = readNumberEffect(tech, "slot_count");
    return slotCount === null ? "strategic project unlocked" : `super hydro slots +${slotCount}`;
  }
  if (tech.effect_type === "storage_buff") {
    const storageMult = readNumberEffect(tech, "storage_mult");
    const unlockTier = readNumberEffect(tech, "unlock_tier");
    return storageMult === null || unlockTier === null
      ? "storage boost"
      : `storage x${storageMult}, renewable tier ${unlockTier}`;
  }
  if (tech.effect_type === "storage_gate") {
    const unlockTier = readNumberEffect(tech, "unlock_tier");
    return unlockTier === null ? "storage gate" : `renewable tier ${unlockTier} gate`;
  }
  if (tech.effect_type === "grid") {
    const regionalCost = readNumberEffect(tech, "grid_link_cost_pct");
    const trunkCost = readNumberEffect(tech, "trunk_link_cost_pct");
    if (regionalCost !== null) return `regional grid cost ${formatSignedPercent(regionalCost)}`;
    if (trunkCost !== null) return `trunk grid cost ${formatSignedPercent(trunkCost)}`;
    if (tech.effect_value.trunk_loss_profile === "uhv") return "trunk loss uses UHV profile";
    return `${tech.effect_target} grid unlock`;
  }
  if (tech.effect_type === "modifier") {
    const buildCost = readNumberEffect(tech, "build_cost_pct");
    const opex = readNumberEffect(tech, "opex_pct");
    const regionalLoss = readNumberEffect(tech, "regional_loss_pct");
    const loanTierBonus = readNumberEffect(tech, "loan_tier_bonus");
    const disasterCash = readNumberEffect(tech, "disaster_cash_pct");
    const ecoCitySv = readNumberEffect(tech, "eco_city_sv_pct");
    if (buildCost !== null) return `build cost ${formatSignedPercent(buildCost)}`;
    if (opex !== null) return `${tech.effect_target} opex ${formatSignedPercent(opex)}`;
    if (regionalLoss !== null) return `regional loss ${formatSignedPercent(regionalLoss)}`;
    if (loanTierBonus !== null) return `loan tier +${loanTierBonus}`;
    if (disasterCash !== null) return `disaster cash ${formatSignedPercent(disasterCash)}`;
    if (ecoCitySv !== null) return `eco city SV ${formatSignedPercent(ecoCitySv)}`;
  }
  return tech.effect_type;
}

export class ScreenTechTree {
  private readonly adRewardService: AdRewardService;

  constructor(controller: RunController, adProvider?: RewardedAdProvider) {
    this.controller = controller;
    this.adRewardService = adProvider
      ? createAdRewardService(controller, adProvider)
      : createDefaultAdRewardService(controller);
  }

  private readonly controller: RunController;

  getSnapshot(): TechTreeSnapshot {
    const active = Object.values(this.controller.state.researches)[0];
    const technologies = this.controller.config.bundle.technologies
      .map((tech) => {
        let status: TechTreeNodeSnapshot["status"] = "locked";
        if (this.controller.state.litTechIds.includes(tech.tech_id)) {
          status = "lit";
        } else if (this.controller.state.researches[tech.tech_id]) {
          status = "researching";
        } else if (
          this.controller.state.companyLevel >= tech.company_level_min &&
          (tech.requires_lit ?? []).every((requiredTechId) =>
            this.controller.state.litTechIds.includes(requiredTechId)
          )
        ) {
          status = "unlocked";
        }

        return {
          techId: tech.tech_id,
          displayName: tech.display_name,
          tab: tech.tab,
          companyLevelMin: tech.company_level_min,
          status,
          requiresLit: [...(tech.requires_lit ?? [])],
          researchCost: getResearchCost(this.controller.state, this.controller.config, tech.research_cost),
          researchMonths: getResearchMonths(this.controller.state, this.controller.config, tech.research_months),
          effectSummary: formatTechEffectSummary(tech)
        };
      })
      .sort((a, b) => a.companyLevelMin - b.companyLevelMin || a.techId.localeCompare(b.techId));
    const researchableTechIds = technologies
      .filter((tech) => tech.status === "unlocked")
      .map((tech) => tech.techId);
    return {
      month: this.controller.state.currentMonth,
      companyLevel: this.controller.state.companyLevel,
      funds: this.controller.state.funds,
      canOpen: this.controller.state.companyLevel >= 2,
      technologies,
      researchableTechIds,
      activeResearch: active
        ? {
            techId: active.techId,
            researchId: active.researchId,
            monthsRemaining: active.monthsRemaining
          }
        : null,
      litTechIds: [...this.controller.state.litTechIds]
    };
  }

  startResearch(techId: string): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "start_research", techId });
    const after = this.getSnapshot();
    const uiErrorCode = mapUiError(result);
    return { before, after, result, uiErrorCode, uiCopy: resolveTechTreeUiCopy(uiErrorCode) };
  }

  cancelResearch(researchId: string): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "cancel_research", researchId });
    const after = this.getSnapshot();
    const uiErrorCode = mapUiError(result);
    return { before, after, result, uiErrorCode, uiCopy: resolveTechTreeUiCopy(uiErrorCode) };
  }

  private toSpeedupAdActionOutput(
    before: TechTreeSnapshot,
    adAction: ReturnType<AdRewardService["claimRewardByAd"]>
  ): TechTreeActionOutput {
    const after = this.getSnapshot();
    if (!adAction.rewarded) {
      const result =
        adAction.claimResult ??
        syntheticAdBlockedResult(adAction.adOutcome.message ?? "ad reward blocked");
      const uiErrorCode = mapAdUiError(adAction.uiErrorCode, adAction.claimResult);
      return {
        before,
        after,
        result,
        uiErrorCode,
        uiCopy: resolveTechTreeUiCopy(uiErrorCode)
      };
    }
    const result = adAction.claimResult!;
    const uiErrorCode = mapUiError(result);
    return { before, after, result, uiErrorCode, uiCopy: resolveTechTreeUiCopy(uiErrorCode) };
  }

  speedupResearchByAd(): TechTreeActionOutput {
    const before = this.getSnapshot();
    const adAction = this.adRewardService.claimRewardByAd("speedup", "screen_tech_tree.speedup");
    return this.toSpeedupAdActionOutput(before, adAction);
  }

  async speedupResearchByAdAsync(): Promise<TechTreeActionOutput> {
    const before = this.getSnapshot();
    const adAction = await this.adRewardService.claimRewardByAdAsync(
      "speedup",
      "screen_tech_tree.speedup"
    );
    return this.toSpeedupAdActionOutput(before, adAction);
  }
}

export function createScreenTechTree(
  controller: RunController,
  adProvider?: RewardedAdProvider
): ScreenTechTree {
  return new ScreenTechTree(controller, adProvider);
}
