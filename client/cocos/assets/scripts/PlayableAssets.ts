import { resources, SpriteFrame } from "cc";

export type FacilityId = "wind" | "solar" | "thermal";

export interface SpriteCatalog {
  funds: SpriteFrame;
  energy: SpriteFrame;
  companyExp: SpriteFrame;
  calendar: SpriteFrame;
  turnIncome: SpriteFrame;
  build: SpriteFrame;
  confirm: SpriteFrame;
  techNormal: SpriteFrame;
  techSelected: SpriteFrame;
  techLocked: SpriteFrame;
  clean: SpriteFrame;
  needsImprovement: SpriteFrame;
  windThumbnail: SpriteFrame;
  solarThumbnail: SpriteFrame;
  thermalThumbnail: SpriteFrame;
  windMaster: SpriteFrame;
  solarMaster: SpriteFrame;
  thermalMaster: SpriteFrame;
}

function loadSpriteFrame(path: string): Promise<SpriteFrame> {
  return new Promise((resolve, reject) => {
    resources.load(`${path}/spriteFrame`, SpriteFrame, (loadError, asset) => {
      if (loadError || !asset) {
        reject(loadError ?? new Error(`sprite missing: ${path}`));
        return;
      }
      resolve(asset);
    });
  });
}

export async function loadSpriteCatalog(): Promise<SpriteCatalog> {
  const [
    funds,
    energy,
    companyExp,
    calendar,
    turnIncome,
    build,
    confirm,
    techNormal,
    techSelected,
    techLocked,
    clean,
    needsImprovement,
    windThumbnail,
    solarThumbnail,
    thermalThumbnail,
    windMaster,
    solarMaster,
    thermalMaster
  ] = await Promise.all([
    loadSpriteFrame("art/icons/funds"),
    loadSpriteFrame("art/icons/energy"),
    loadSpriteFrame("art/icons/company-exp"),
    loadSpriteFrame("art/icons/calendar"),
    loadSpriteFrame("art/icons/turn-income"),
    loadSpriteFrame("art/icons/build"),
    loadSpriteFrame("art/icons/confirm"),
    loadSpriteFrame("art/icons/tech-normal"),
    loadSpriteFrame("art/icons/tech-selected"),
    loadSpriteFrame("art/icons/tech-locked"),
    loadSpriteFrame("art/icons/clean"),
    loadSpriteFrame("art/icons/needs-improvement"),
    loadSpriteFrame("art/buildings/wind-thumbnail"),
    loadSpriteFrame("art/buildings/solar-thumbnail"),
    loadSpriteFrame("art/buildings/thermal-thumbnail"),
    loadSpriteFrame("art/buildings/wind-master"),
    loadSpriteFrame("art/buildings/solar-master"),
    loadSpriteFrame("art/buildings/thermal-master")
  ]);
  return {
    funds,
    energy,
    companyExp,
    calendar,
    turnIncome,
    build,
    confirm,
    techNormal,
    techSelected,
    techLocked,
    clean,
    needsImprovement,
    windThumbnail,
    solarThumbnail,
    thermalThumbnail,
    windMaster,
    solarMaster,
    thermalMaster
  };
}
