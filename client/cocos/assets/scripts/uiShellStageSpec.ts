export const UI_SHELL_LAYER_NAMES = {
  root: "ProductUiShellLayer",
  entry: "ProductEntryShellLayer",
  page: "ProductPageShellLayer",
  modal: "ProductModalShellLayer",
  result: "ProductResultShellLayer"
} as const;

export const UI_SHELL_SCREEN_TOKENS = {
  mainMenu: "ui-shell:screen-main-menu",
  city: "ui-shell:screen-city-detail",
  company: "ui-shell:screen-company",
  tech: "ui-shell:screen-tech-tree",
  region: "ui-shell:screen-region",
  world: "ui-shell:screen-world-map",
  runResult: "ui-shell:screen-run-result"
} as const;

export const UI_SHELL_SLOT_STATE_TOKENS = {
  active: "ui-shell:slot-active",
  hidden: "ui-shell:slot-hidden",
  placeholder: "ui-shell:slot-placeholder",
  bound: "ui-shell:slot-bound",
  locked: "ui-shell:slot-locked",
  available: "ui-shell:slot-available",
  warning: "ui-shell:slot-warning"
} as const;

export const UI_SHELL_SLOT_ROLE_TOKENS = {
  resourceBar: "ui-shell:role-resource-bar",
  statusCard: "ui-shell:role-status-card",
  actionArea: "ui-shell:role-action-area",
  nav: "ui-shell:role-bottom-nav",
  asset: "ui-shell:role-asset-slot",
  graph: "ui-shell:role-graph",
  map: "ui-shell:role-map",
  modal: "ui-shell:role-modal",
  result: "ui-shell:role-result"
} as const;

export interface UiShellStageSlot {
  nodeName: string;
  screen: keyof typeof UI_SHELL_SCREEN_TOKENS | "eventModal";
  role: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

export const UI_SHELL_ENTRY_SLOTS = {
  startNewRun: {
    nodeName: "EntryActionStartNewRun",
    screen: "mainMenu",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.5,
    yRatio: 0.45,
    widthRatio: 0.38,
    heightRatio: 0.09
  },
  continueRun: {
    nodeName: "EntryActionContinueRun",
    screen: "mainMenu",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.5,
    yRatio: 0.34,
    widthRatio: 0.38,
    heightRatio: 0.09
  },
  clearSave: {
    nodeName: "EntryActionClearSave",
    screen: "mainMenu",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.5,
    yRatio: 0.23,
    widthRatio: 0.38,
    heightRatio: 0.09
  },
  saveHint: {
    nodeName: "EntryCurrentSaveHint",
    screen: "mainMenu",
    role: UI_SHELL_SLOT_ROLE_TOKENS.statusCard,
    xRatio: 0.5,
    yRatio: 0.58,
    widthRatio: 0.52,
    heightRatio: 0.08
  }
} as const satisfies Record<string, UiShellStageSlot>;

export const UI_SHELL_PAGE_SLOTS = {
  companyOverview: {
    nodeName: "CompanyOverviewPanel",
    screen: "company",
    role: UI_SHELL_SLOT_ROLE_TOKENS.statusCard,
    xRatio: 0.24,
    yRatio: 0.62,
    widthRatio: 0.32,
    heightRatio: 0.18
  },
  companyCashflow: {
    nodeName: "CompanyCashflowPanel",
    screen: "company",
    role: UI_SHELL_SLOT_ROLE_TOKENS.graph,
    xRatio: 0.58,
    yRatio: 0.58,
    widthRatio: 0.34,
    heightRatio: 0.22
  },
  companyLoanAdsUpgrade: {
    nodeName: "CompanyLoanAdsUpgradeArea",
    screen: "company",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.5,
    yRatio: 0.34,
    widthRatio: 0.7,
    heightRatio: 0.16
  },
  techBranchTabs: {
    nodeName: "TechBranchTabs",
    screen: "tech",
    role: UI_SHELL_SLOT_ROLE_TOKENS.nav,
    xRatio: 0.5,
    yRatio: 0.69,
    widthRatio: 0.7,
    heightRatio: 0.08
  },
  techNodeGraph: {
    nodeName: "TechNodeGraphPlaceholder",
    screen: "tech",
    role: UI_SHELL_SLOT_ROLE_TOKENS.graph,
    xRatio: 0.43,
    yRatio: 0.45,
    widthRatio: 0.5,
    heightRatio: 0.3
  },
  techResearchDrawer: {
    nodeName: "TechResearchDrawer",
    screen: "tech",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.78,
    yRatio: 0.45,
    widthRatio: 0.22,
    heightRatio: 0.3
  },
  regionCityNodes: {
    nodeName: "RegionCityNodeLayer",
    screen: "region",
    role: UI_SHELL_SLOT_ROLE_TOKENS.map,
    xRatio: 0.42,
    yRatio: 0.5,
    widthRatio: 0.5,
    heightRatio: 0.34
  },
  regionLinkBuildBar: {
    nodeName: "RegionLinkBuildBar",
    screen: "region",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.72,
    yRatio: 0.35,
    widthRatio: 0.24,
    heightRatio: 0.12
  },
  worldRegionNodes: {
    nodeName: "WorldRegionNodeLayer",
    screen: "world",
    role: UI_SHELL_SLOT_ROLE_TOKENS.map,
    xRatio: 0.46,
    yRatio: 0.5,
    widthRatio: 0.58,
    heightRatio: 0.34
  },
  worldBackboneLayer: {
    nodeName: "WorldBackboneLinkLayer",
    screen: "world",
    role: UI_SHELL_SLOT_ROLE_TOKENS.asset,
    xRatio: 0.46,
    yRatio: 0.5,
    widthRatio: 0.58,
    heightRatio: 0.34
  },
  worldSuperHydroEntry: {
    nodeName: "WorldSuperHydroEntryCard",
    screen: "world",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.78,
    yRatio: 0.38,
    widthRatio: 0.22,
    heightRatio: 0.14
  }
} as const satisfies Record<string, UiShellStageSlot>;

export const UI_SHELL_MODAL_SLOTS = {
  eventFullscreen: {
    nodeName: "EventFullscreenModalShell",
    screen: "eventModal",
    role: UI_SHELL_SLOT_ROLE_TOKENS.modal,
    xRatio: 0.5,
    yRatio: 0.5,
    widthRatio: 0.72,
    heightRatio: 0.58
  },
  eventArt: {
    nodeName: "EventModalArtSlot",
    screen: "eventModal",
    role: UI_SHELL_SLOT_ROLE_TOKENS.asset,
    xRatio: 0.5,
    yRatio: 0.62,
    widthRatio: 0.46,
    heightRatio: 0.24
  },
  eventConfirm: {
    nodeName: "EventModalConfirmButton",
    screen: "eventModal",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.5,
    yRatio: 0.28,
    widthRatio: 0.24,
    heightRatio: 0.1
  }
} as const satisfies Record<string, UiShellStageSlot>;

export const UI_SHELL_RESULT_SLOTS = {
  resultBanner: {
    nodeName: "RunResultBanner",
    screen: "runResult",
    role: UI_SHELL_SLOT_ROLE_TOKENS.result,
    xRatio: 0.5,
    yRatio: 0.68,
    widthRatio: 0.52,
    heightRatio: 0.12
  },
  routeSummary: {
    nodeName: "RunResultRouteSummary",
    screen: "runResult",
    role: UI_SHELL_SLOT_ROLE_TOKENS.statusCard,
    xRatio: 0.5,
    yRatio: 0.48,
    widthRatio: 0.62,
    heightRatio: 0.22
  },
  restartEntry: {
    nodeName: "RunResultRestartEntry",
    screen: "runResult",
    role: UI_SHELL_SLOT_ROLE_TOKENS.actionArea,
    xRatio: 0.5,
    yRatio: 0.28,
    widthRatio: 0.32,
    heightRatio: 0.1
  }
} as const satisfies Record<string, UiShellStageSlot>;

export const UI_SHELL_STAGE_PREFAB_MANIFEST = {
  shellId: "ui-shell-long-01",
  layers: UI_SHELL_LAYER_NAMES,
  screenTokens: UI_SHELL_SCREEN_TOKENS,
  entrySlots: UI_SHELL_ENTRY_SLOTS,
  pageSlots: UI_SHELL_PAGE_SLOTS,
  modalSlots: UI_SHELL_MODAL_SLOTS,
  resultSlots: UI_SHELL_RESULT_SLOTS,
  requiredRuntimeTokens: [
    UI_SHELL_SLOT_STATE_TOKENS.active,
    UI_SHELL_SLOT_STATE_TOKENS.hidden,
    UI_SHELL_SLOT_STATE_TOKENS.placeholder,
    UI_SHELL_SLOT_STATE_TOKENS.bound,
    UI_SHELL_SLOT_STATE_TOKENS.locked,
    UI_SHELL_SLOT_STATE_TOKENS.available,
    UI_SHELL_SLOT_STATE_TOKENS.warning
  ]
} as const;

export const UI_SHELL_ALL_SLOTS: readonly UiShellStageSlot[] = [
  ...Object.values(UI_SHELL_ENTRY_SLOTS),
  ...Object.values(UI_SHELL_PAGE_SLOTS),
  ...Object.values(UI_SHELL_MODAL_SLOTS),
  ...Object.values(UI_SHELL_RESULT_SLOTS)
];

export type UiShellStagePrefabManifest = typeof UI_SHELL_STAGE_PREFAB_MANIFEST;
