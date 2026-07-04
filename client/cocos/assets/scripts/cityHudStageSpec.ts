export const CITY_HUD_STAGE_LAYER_NAMES = {
  root: "CityVisualLayer",
  background: "CityBackgroundLayer",
  facility: "CityFacilityLayer",
  grid: "CityGridLayer",
  state: "CityStateLayer",
  ui: "CityUiLayer",
  icon: "CityIconLayer"
} as const;

export const CITY_HUD_STAGE_SHELL_ORDER = [
  CITY_HUD_STAGE_LAYER_NAMES.root,
  CITY_HUD_STAGE_LAYER_NAMES.ui,
  CITY_HUD_STAGE_LAYER_NAMES.icon
] as const;

export const CITY_HUD_STAGE_VISUAL_ORDER = [
  CITY_HUD_STAGE_LAYER_NAMES.background,
  CITY_HUD_STAGE_LAYER_NAMES.facility,
  CITY_HUD_STAGE_LAYER_NAMES.grid,
  CITY_HUD_STAGE_LAYER_NAMES.state
] as const;

export const CITY_HUD_STAGE_ASSET_SLOTS = {
  windTurbine: {
    nodeName: "StageAssetWindTurbine",
    layer: CITY_HUD_STAGE_LAYER_NAMES.facility,
    xRatio: 0.2,
    yRatio: 0.4,
    widthRatio: 0.08,
    heightRatio: 0.12
  },
  solarField: {
    nodeName: "StageAssetSolarField",
    layer: CITY_HUD_STAGE_LAYER_NAMES.facility,
    xRatio: 0.48,
    yRatio: 0.4,
    widthRatio: 0.11,
    heightRatio: 0.07
  },
  hydroPlant: {
    nodeName: "StageAssetHydroPlant",
    layer: CITY_HUD_STAGE_LAYER_NAMES.facility,
    xRatio: 0.76,
    yRatio: 0.5,
    widthRatio: 0.1,
    heightRatio: 0.08
  },
  cleanBadge: {
    nodeName: "StageStateCleanBadge",
    layer: CITY_HUD_STAGE_LAYER_NAMES.state,
    xRatio: 0.72,
    yRatio: 0.58,
    widthRatio: 0.2,
    heightRatio: 0.07
  },
  warningBadge: {
    nodeName: "StageStateWarningBadge",
    layer: CITY_HUD_STAGE_LAYER_NAMES.state,
    xRatio: 0.78,
    yRatio: 0.59,
    widthRatio: 0.18,
    heightRatio: 0.07
  }
} as const;

export const CITY_HUD_STAGE_STATE_TOKENS = {
  clean: "city-stage:clean",
  lowCleanliness: "city-stage:low-cleanliness",
  night: "city-stage:night"
} as const;

export const CITY_HUD_STAGE_UI_SLOTS = {
  resourceBar: {
    nodeName: "StageUiResourceBar",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui
  },
  cityStateCard: {
    nodeName: "StageUiCityStateCard",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui
  },
  primaryBuildButton: {
    nodeName: "StageUiPrimaryBuildButton",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui
  }
} as const;

export const CITY_HUD_STAGE_ACTION_SLOTS = {
  cycleBuild: {
    nodeName: "StageActionCycleBuild",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "secondary"
  },
  advanceMonth: {
    nodeName: "StageActionAdvanceMonth",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "primary"
  },
  ackEvent: {
    nodeName: "StageActionAckEvent",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "warning"
  },
  applyLoan: {
    nodeName: "StageActionApplyLoan",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "secondary"
  },
  cycleLoan: {
    nodeName: "StageActionCycleLoan",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "secondary"
  },
  adCash: {
    nodeName: "StageActionAdCash",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "reward"
  },
  startResearch: {
    nodeName: "StageActionStartResearch",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "primary"
  },
  cancelResearch: {
    nodeName: "StageActionCancelResearch",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "warning"
  },
  queueRegionLink: {
    nodeName: "StageActionQueueRegionLink",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "primary"
  },
  cancelRegionLink: {
    nodeName: "StageActionCancelRegionLink",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "warning"
  },
  cycleRegionLink: {
    nodeName: "StageActionCycleRegionLink",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "secondary"
  },
  openWorldTarget: {
    nodeName: "StageActionOpenWorldTarget",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "secondary"
  },
  cycleWorldTarget: {
    nodeName: "StageActionCycleWorldTarget",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "secondary"
  },
  queueWorldTrunk: {
    nodeName: "StageActionQueueWorldTrunk",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "primary"
  },
  queueSuperHydro: {
    nodeName: "StageActionQueueSuperHydro",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "primary"
  },
  queueSuperHydroGrid: {
    nodeName: "StageActionQueueSuperHydroGrid",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "primary"
  },
  adSpeedup: {
    nodeName: "StageActionAdSpeedup",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "reward"
  },
  openCompany: {
    nodeName: "StageNavCompany",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "nav"
  },
  openRegion: {
    nodeName: "StageNavRegion",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "nav"
  },
  openWorld: {
    nodeName: "StageNavWorld",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "nav"
  },
  openTech: {
    nodeName: "StageNavTech",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "nav"
  },
  navBack: {
    nodeName: "StageNavBack",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "nav"
  }
} as const;

export const CITY_HUD_STAGE_INTERACTION_TOKENS = {
  active: "city-stage:action-active",
  hidden: "city-stage:action-hidden",
  primary: "city-stage:action-primary",
  secondary: "city-stage:action-secondary",
  reward: "city-stage:action-reward",
  warning: "city-stage:action-warning",
  nav: "city-stage:action-nav"
} as const;

export const CITY_HUD_STAGE_ICON_SLOTS = {
  cash: {
    nodeName: "StageIconCash",
    layer: CITY_HUD_STAGE_LAYER_NAMES.icon
  },
  socialValue: {
    nodeName: "StageIconSocialValue",
    layer: CITY_HUD_STAGE_LAYER_NAMES.icon
  },
  cleanliness: {
    nodeName: "StageIconCleanliness",
    layer: CITY_HUD_STAGE_LAYER_NAMES.icon
  }
} as const;

export type CityHudStageAssetSlot =
  (typeof CITY_HUD_STAGE_ASSET_SLOTS)[keyof typeof CITY_HUD_STAGE_ASSET_SLOTS];

export type CityHudStageActionSlot =
  (typeof CITY_HUD_STAGE_ACTION_SLOTS)[keyof typeof CITY_HUD_STAGE_ACTION_SLOTS];
