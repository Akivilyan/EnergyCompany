import type { ConfigRepo } from "../config/configRepo.js";
import type { GameState } from "../types/gameState.js";
import { aggregateIncomeMult } from "../systems/debuff.js";
import {
  getFacilityTierSpec,
  getMonthlyOperatingCost,
  hasStorageOutputBoost
} from "./technologyEffects.js";

export interface RecurringCashflowEstimate {
  grossIncome: number;
  income: number;
  opex: number;
  fuel: number;
  loanPaid: number;
  net: number;
}

export function getCityResourceMultiplier(
  config: ConfigRepo,
  cityId: string,
  facilityId: string
): number {
  const city = config.getCity(cityId);
  if (!city) return 1;
  const resource =
    facilityId === "wind"
      ? city.wind_resource
      : facilityId === "solar"
        ? city.solar_resource
        : facilityId === "hydro"
          ? city.hydro_resource
          : undefined;
  return resource === "rich" ? 2 : 1;
}

export function getFacilityEffectiveOutputMw(
  state: GameState,
  config: ConfigRepo,
  cityId: string,
  facilityId: string,
  tier: number
): number | null {
  const spec = getFacilityTierSpec(config, facilityId, tier);
  if (!spec) return null;
  const storageMultiplier =
    hasStorageOutputBoost(state) && new Set(["wind", "solar", "hydro"]).has(facilityId)
      ? 2
      : 1;
  return spec.outputMw * getCityResourceMultiplier(config, cityId, facilityId) * storageMultiplier;
}

/**
 * 只读的常态月度现金流查询。它与 M5-M8 共用同一套规则函数，且刻意排除
 * 建设扣款、广告、贷款到账、未来事件及尚未完工项目。
 */
export function calculateRecurringCashflow(
  state: GameState,
  config: ConfigRepo
): RecurringCashflowEstimate {
  let grossIncome = 0;
  for (const city of Object.values(state.cities)) {
    grossIncome += Math.floor(city.demandMw * city.supplyRatio * state.incomePricePerMw);
  }
  const incomeMult = aggregateIncomeMult(state);
  const income = Math.floor((grossIncome * incomeMult.num) / incomeMult.den);

  let opex = 0;
  let fuel = 0;
  for (const facility of Object.values(state.facilities)) {
    opex += getMonthlyOperatingCost(
      state,
      config,
      facility.monthlyOpex,
      facility.facilityId
    );
    fuel += facility.monthlyFuel;
  }

  let loanPaid = 0;
  for (const loan of Object.values(state.loans)) {
    if (loan.monthsRemaining > 0) loanPaid += loan.monthlyPayment;
  }

  return {
    grossIncome,
    income,
    opex,
    fuel,
    loanPaid,
    net: income - opex - fuel - loanPaid
  };
}
