export type Command =
  | { type: "queue_construction"; cityId: string; facilityId: string; tier: number }
  | { type: "start_research"; techId: string }
  | { type: "apply_loan"; loanId: string }
  | {
      type: "claim_ad_reward";
      adType: "cash" | "speedup" | "shield";
      targetId?: string;
    };
