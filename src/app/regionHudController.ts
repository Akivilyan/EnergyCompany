import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import type { ClientNavResult } from "./screenNavController.js";

/** v0 开发 HUD 默认区域铺线（与 sim:region-loop 一致）。 */
export const DEFAULT_REGION_LINK = {
  fromCityId: "CITY-START",
  toCityId: "CITY-MAP01-02",
  linkType: "region" as const
};

export interface RegionHudActionResult {
  ok: boolean;
  view: ClientNavResult["view"];
  errorCode: string | null;
  messageKey: string | null;
}

function toActionResult(
  boot: GameBootstrap,
  ok: boolean,
  errorCode: string | null,
  messageKey: string | null
): RegionHudActionResult {
  return {
    ok,
    view: readCityHudViewModel(boot),
    errorCode,
    messageKey
  };
}

function resolveQueueErrorMessageKey(errorCode: string): string {
  switch (errorCode) {
    case "not_unlocked":
      return "region.error.not_unlocked";
    case "insufficient_funds":
      return "region.error.insufficient_funds";
    case "conflict_in_progress":
      return "region.error.link_exists";
    case "invalid_command_payload":
      return "region.error.invalid_link";
    default:
      return "region.error.action_failed";
  }
}

/** 铺默认区内线（起始城 → MAP01-02）。 */
export function regionQueueDefaultLink(boot: GameBootstrap): RegionHudActionResult {
  const { fromCityId, toCityId, linkType } = DEFAULT_REGION_LINK;
  const out = boot.app.screens.region.queueGridLink(fromCityId, toCityId, linkType);
  if (out.result.ok) {
    return toActionResult(boot, true, null, "region.success.link_queued");
  }
  const code = out.result.error;
  return toActionResult(boot, false, code, resolveQueueErrorMessageKey(code));
}
