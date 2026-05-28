export type Command =
  | { type: "queue_construction"; cityId: string; facilityId: string; tier: number }
  | { type: "queue_grid_link"; fromCityId: string; toCityId: string; linkType: "region" | "trunk" }
  | { type: "start_research"; techId: string }
  | { type: "apply_loan"; loanId: string }
  | {
      type: "claim_ad_reward";
      adType: "cash" | "speedup" | "shield";
      targetId?: string;
    };
