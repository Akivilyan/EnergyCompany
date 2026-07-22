import type { ConfigRepo } from "../sim/config/configRepo.js";
import { getCitySocialValue, type GameState } from "../sim/index.js";

export type CompanyUnlockKind = "city" | "region" | "technology" | "loan" | "entry";

export interface CompanyUnlockItem {
  id: string;
  kind: CompanyUnlockKind;
  label: string;
  unlockLevel: number;
}

export interface CompanyLevelUnlockRow {
  level: number;
  threshold: number;
  unlockNotes: string | null;
  capitalRegionCount: number;
  ordinaryRegionCount: number;
  unlocked: boolean;
  newlyUnlocked: CompanyUnlockItem[];
}

export interface CompanyExpCityBreakdown {
  cityId: string;
  displayName: string;
  effectiveSupplyMw: number;
  demandMw: number;
  supplyRatio: number;
  fullyEco: boolean;
  ecoCapFactor: number;
  exp: number;
}

export interface CompanyGrowthSnapshot {
  level: number;
  levelRoman: string;
  expCurrent: number;
  nextLevel: number | null;
  nextThreshold: number | null;
  progressRatio: number;
  expCanDecrease: true;
  levelCanDecrease: false;
  entries: {
    company: { unlocked: true; requiredLevel: 1 };
    technology: { unlocked: boolean; requiredLevel: 2 };
    worldMap: { unlocked: boolean; requiredLevel: 2 };
  };
  cityBreakdown: CompanyExpCityBreakdown[];
  unlockMatrix: CompanyLevelUnlockRow[];
  currentLevelUnlocks: CompanyUnlockItem[];
}

const ROMAN_LEVELS = ["0", "I", "II", "III", "IV", "V"] as const;

function levelRoman(level: number): string {
  return ROMAN_LEVELS[level] ?? `${level}`;
}

function cityExp(state: GameState, config: ConfigRepo, cityId: string): number {
  const city = state.cities[cityId];
  if (!city) return 0;
  return getCitySocialValue(state, config, city);
}

export function buildCompanyUnlockMatrix(
  config: ConfigRepo,
  companyLevel: number
): CompanyLevelUnlockRow[] {
  return [...config.bundle.companyLevels]
    .sort((a, b) => a.level - b.level)
    .map((levelConfig) => {
      const level = levelConfig.level;
      const newlyUnlocked: CompanyUnlockItem[] = [];

      if (level === 1) {
        newlyUnlocked.push({
          id: "screen_company",
          kind: "entry",
          label: "公司经营入口",
          unlockLevel: level
        });
      }
      if (level === 2) {
        newlyUnlocked.push(
          {
            id: "screen_tech_tree",
            kind: "entry",
            label: "科技研发入口",
            unlockLevel: level
          },
          {
            id: "screen_world_map",
            kind: "entry",
            label: "起始省经营入口",
            unlockLevel: level
          }
        );
      }

      for (const region of config.bundle.regions) {
        if (region.unlock_company_level !== level) continue;
        newlyUnlocked.push({
          id: region.region_id,
          kind: "region",
          label: region.display_name ?? region.region_id,
          unlockLevel: level
        });
      }
      for (const city of config.bundle.cities) {
        if (city.unlock_company_level !== level) continue;
        newlyUnlocked.push({
          id: city.city_id,
          kind: "city",
          label: city.display_name ?? city.city_id,
          unlockLevel: level
        });
      }
      for (const tech of config.bundle.technologies) {
        if (tech.company_level_min !== level || tech.starts_lit) continue;
        newlyUnlocked.push({
          id: tech.tech_id,
          kind: "technology",
          label: tech.display_name,
          unlockLevel: level
        });
      }
      for (const loan of config.bundle.loanTiers) {
        const unlockLevel = loan.unlock_level ?? 1;
        if (unlockLevel !== level) continue;
        newlyUnlocked.push({
          id: loan.loan_id,
          kind: "loan",
          label: `${loan.principal} 万贷款档位`,
          unlockLevel: level
        });
      }

      return {
        level,
        threshold: levelConfig.sv_threshold,
        unlockNotes: levelConfig.unlock_notes ?? null,
        capitalRegionCount: levelConfig.unlock_region_capital_count,
        ordinaryRegionCount: levelConfig.unlock_region_ordinary_count,
        unlocked: companyLevel >= level,
        newlyUnlocked
      };
    });
}

export function buildCompanyGrowthSnapshot(
  state: GameState,
  config: ConfigRepo
): CompanyGrowthSnapshot {
  const rows = [...config.bundle.companyLevels].sort((a, b) => a.level - b.level);
  const nextRow = rows.find((row) => row.level > state.companyLevel) ?? null;
  const unlockMatrix = buildCompanyUnlockMatrix(config, state.companyLevel);
  const cityBreakdown = Object.values(state.cities)
    .map((city) => {
      const cityConfig = config.getCity(city.cityId);
      return {
        cityId: city.cityId,
        displayName: cityConfig?.display_name ?? city.cityId,
        effectiveSupplyMw: city.effectiveSupplyMw,
        demandMw: city.demandMw,
        supplyRatio: city.supplyRatio,
        fullyEco: city.cityFullyEcoSupply,
        ecoCapFactor: city.ecoCapFactor,
        exp: cityExp(state, config, city.cityId)
      };
    })
    .sort((a, b) => a.cityId.localeCompare(b.cityId));
  const nextThreshold = nextRow?.sv_threshold ?? null;

  return {
    level: state.companyLevel,
    levelRoman: levelRoman(state.companyLevel),
    expCurrent: state.socialValueCurrent,
    nextLevel: nextRow?.level ?? null,
    nextThreshold,
    progressRatio:
      nextThreshold === null || nextThreshold <= 0
        ? 1
        : Math.max(0, Math.min(1, state.socialValueCurrent / nextThreshold)),
    expCanDecrease: true,
    levelCanDecrease: false,
    entries: {
      company: { unlocked: true, requiredLevel: 1 },
      technology: { unlocked: state.companyLevel >= 2, requiredLevel: 2 },
      worldMap: { unlocked: state.companyLevel >= 2, requiredLevel: 2 }
    },
    cityBreakdown,
    unlockMatrix,
    currentLevelUnlocks:
      unlockMatrix.find((row) => row.level === state.companyLevel)?.newlyUnlocked ?? []
  };
}
