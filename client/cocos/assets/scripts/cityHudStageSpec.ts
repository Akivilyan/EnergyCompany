export const CITY_HUD_STAGE_LAYER_NAMES = {
  root: "CityVisualLayer",
  background: "CityBackgroundLayer",
  facility: "CityFacilityLayer",
  grid: "CityGridLayer",
  effect: "CityEffectLayer",
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
  CITY_HUD_STAGE_LAYER_NAMES.effect,
  CITY_HUD_STAGE_LAYER_NAMES.state
] as const;

export const CITY_HUD_STAGE_ASSET_SLOTS = {
  windTurbine: {
    nodeName: "StageAssetWindTurbine",
    layer: CITY_HUD_STAGE_LAYER_NAMES.facility,
    resource: "wind",
    xRatio: 0.2,
    yRatio: 0.4,
    widthRatio: 0.08,
    heightRatio: 0.12
  },
  solarField: {
    nodeName: "StageAssetSolarField",
    layer: CITY_HUD_STAGE_LAYER_NAMES.facility,
    resource: "solar",
    xRatio: 0.48,
    yRatio: 0.4,
    widthRatio: 0.11,
    heightRatio: 0.07
  },
  hydroPlant: {
    nodeName: "StageAssetHydroPlant",
    layer: CITY_HUD_STAGE_LAYER_NAMES.facility,
    resource: "hydro",
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

export const CITY_HUD_STAGE_SCREEN_TOKENS = {
  city: "city-stage:screen-city",
  company: "city-stage:screen-company",
  region: "city-stage:screen-region",
  world: "city-stage:screen-world",
  tech: "city-stage:screen-tech"
} as const;

export const CITY_HUD_STAGE_ASSET_TOKENS = {
  visible: "city-stage:asset-visible",
  unavailable: "city-stage:asset-unavailable",
  resourceRich: "city-stage:asset-resource-rich",
  resourceNormal: "city-stage:asset-resource-normal",
  placeholder: "city-stage:asset-placeholder"
} as const;

export const CITY_HUD_STAGE_GRID_SLOTS = {
  windSolar: {
    nodeName: "StageGridWindSolar",
    layer: CITY_HUD_STAGE_LAYER_NAMES.grid,
    fromAsset: "windTurbine",
    toAsset: "solarField",
    defaultState: "connected"
  },
  solarHydro: {
    nodeName: "StageGridSolarHydro",
    layer: CITY_HUD_STAGE_LAYER_NAMES.grid,
    fromAsset: "solarField",
    toAsset: "hydroPlant",
    defaultState: "disconnected"
  }
} as const;

export const CITY_HUD_STAGE_GRID_TOKENS = {
  connected: "city-stage:grid-connected",
  disconnected: "city-stage:grid-disconnected",
  stable: "city-stage:grid-stable",
  weak: "city-stage:grid-weak"
} as const;

export const CITY_HUD_STAGE_EFFECT_SLOTS = {
  buildGlow: {
    nodeName: "StageEffectBuildGlow",
    layer: CITY_HUD_STAGE_LAYER_NAMES.effect,
    anchorAsset: "windTurbine",
    widthRatio: 0.13,
    heightRatio: 0.16
  },
  gridGlow: {
    nodeName: "StageEffectGridGlow",
    layer: CITY_HUD_STAGE_LAYER_NAMES.effect,
    anchorAsset: "solarField",
    widthRatio: 0.44,
    heightRatio: 0.08
  }
} as const;

export const CITY_HUD_STAGE_EFFECT_TOKENS = {
  active: "city-stage:effect-active",
  construction: "city-stage:effect-construction",
  grid: "city-stage:effect-grid",
  lowCleanliness: "city-stage:effect-low-cleanliness",
  normal: "city-stage:effect-normal"
} as const;

export const CITY_HUD_STAGE_STATE_TOKENS = {
  clean: "city-stage:clean",
  lowCleanliness: "city-stage:low-cleanliness",
  night: "city-stage:night"
} as const;

export const CITY_HUD_STAGE_UI_SLOTS = {
  resourceBar: {
    nodeName: "StageUiResourceBar",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "resource"
  },
  cityStateCard: {
    nodeName: "StageUiCityStateCard",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "detail"
  },
  primaryBuildButton: {
    nodeName: "StageUiPrimaryBuildButton",
    layer: CITY_HUD_STAGE_LAYER_NAMES.ui,
    role: "primary-action"
  }
} as const;

export const CITY_HUD_STAGE_UI_TOKENS = {
  readable: "city-stage:ui-readable",
  compact: "city-stage:ui-compact",
  resource: "city-stage:ui-resource",
  detail: "city-stage:ui-detail",
  primaryAction: "city-stage:ui-primary-action"
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
    layer: CITY_HUD_STAGE_LAYER_NAMES.icon,
    role: "cash",
    sourcePanel: "resourceBar",
    xRatio: 0.05,
    yRatio: 0.5
  },
  socialValue: {
    nodeName: "StageIconSocialValue",
    layer: CITY_HUD_STAGE_LAYER_NAMES.icon,
    role: "social-value",
    sourcePanel: "resourceBar",
    xRatio: 0.11,
    yRatio: 0.5
  },
  cleanliness: {
    nodeName: "StageIconCleanliness",
    layer: CITY_HUD_STAGE_LAYER_NAMES.icon,
    role: "cleanliness",
    sourcePanel: "cityStateCard",
    xRatio: 0.04,
    yRatio: 0.5
  }
} as const;

export const CITY_HUD_STAGE_ICON_TOKENS = {
  active: "city-stage:icon-active",
  cash: "city-stage:icon-cash",
  socialValue: "city-stage:icon-social-value",
  cleanliness: "city-stage:icon-cleanliness"
} as const;

export type CityHudStageAssetSlot =
  (typeof CITY_HUD_STAGE_ASSET_SLOTS)[keyof typeof CITY_HUD_STAGE_ASSET_SLOTS];

export type CityHudStageActionSlot =
  (typeof CITY_HUD_STAGE_ACTION_SLOTS)[keyof typeof CITY_HUD_STAGE_ACTION_SLOTS];

export type CityHudStageIconSlot =
  (typeof CITY_HUD_STAGE_ICON_SLOTS)[keyof typeof CITY_HUD_STAGE_ICON_SLOTS];

export type CityHudStageGridSlot =
  (typeof CITY_HUD_STAGE_GRID_SLOTS)[keyof typeof CITY_HUD_STAGE_GRID_SLOTS];

export type CityHudStageEffectSlot =
  (typeof CITY_HUD_STAGE_EFFECT_SLOTS)[keyof typeof CITY_HUD_STAGE_EFFECT_SLOTS];
