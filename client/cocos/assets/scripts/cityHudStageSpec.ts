export const CITY_HUD_STAGE_LAYER_NAMES = {
  root: "CityVisualLayer",
  background: "CityBackgroundLayer",
  facility: "CityFacilityLayer",
  grid: "CityGridLayer",
  state: "CityStateLayer",
  ui: "CityUiLayer",
  icon: "CityIconLayer"
} as const;

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
