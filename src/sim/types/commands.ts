export type Command =
  | { type: "queue_construction"; cityId: string; facilityId: string; tier: number }
  | { type: "queue_grid_link"; fromCityId: string; toCityId: string; linkType: "region" | "trunk" }
  | { type: "queue_super_hydro"; slotId: string }
  | { type: "start_research"; techId: string }
  | { type: "cancel_research"; researchId: string }
  | { type: "apply_loan"; loanId: string }
  | { type: "advance_onboarding" }
  | { type: "skip_onboarding" }
  | {
      type: "claim_ad_reward";
      adType: "cash" | "speedup" | "shield";
      targetId?: string;
    };
