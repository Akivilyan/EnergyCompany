import {
  regionCancelSelectedLink,
  regionCycleLinkCandidate,
  regionQueueLinkByCities,
  regionQueueDefaultLink,
  type GameBootstrap
} from "../../shared/game-client.mjs";

export interface RegionActionResult {
  ok: boolean;
  messageKey: string | null;
  errorCode: string | null;
}

export function queueDefaultRegionLink(boot: GameBootstrap): RegionActionResult {
  const out = regionQueueDefaultLink(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function cancelSelectedRegionLink(boot: GameBootstrap): RegionActionResult {
  const out = regionCancelSelectedLink(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function cycleRegionLink(boot: GameBootstrap): RegionActionResult {
  const out = regionCycleLinkCandidate(boot);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}

export function queueRegionLinkByCityPair(
  boot: GameBootstrap,
  fromCityId: string,
  toCityId: string
): RegionActionResult {
  const out = regionQueueLinkByCities(boot, fromCityId, toCityId);
  return { ok: out.ok, messageKey: out.messageKey, errorCode: out.errorCode };
}
