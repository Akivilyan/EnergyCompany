import {
  cityHudAdvanceMonth,
  cityHudBuildSelected,
  cityHudCycleBuildCandidate,
  type GameBootstrap
} from "../../shared/game-client.mjs";

export interface CityActionResult {
  ok: boolean;
  messageKey: string | null;
  errorCode: string | null;
}

export function buildSelectedCityFacility(
  boot: GameBootstrap,
  facilityId: string
): CityActionResult {
  const out = cityHudBuildSelected(boot, facilityId);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function cycleCityBuildCandidate(boot: GameBootstrap): CityActionResult {
  const out = cityHudCycleBuildCandidate(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function advanceCityMonth(boot: GameBootstrap): CityActionResult {
  const out = cityHudAdvanceMonth(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}
