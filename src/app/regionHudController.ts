import { t } from "../i18n/index.js";
import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import type { ClientNavResult } from "./screenNavController.js";

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

export interface RegionHudSelectionSnapshot {
  candidates: Array<{
    candidateId: string;
    fromCityId: string;
    toCityId: string;
    linkType: "region" | "trunk";
    label: string;
    available: boolean;
    cost: number;
    lossMw: number;
  }>;
  selectedCandidateId: string | null;
  cancelableLinks: Array<{
    linkId: string;
    fromCityId: string;
    toCityId: string;
    linkType: "region" | "trunk";
    label: string;
    buildCost: number | null;
  }>;
}

const selectedCandidateByBoot = new WeakMap<GameBootstrap, string>();
const selectedCancelableLinkByBoot = new WeakMap<GameBootstrap, string>();

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

function resolveCancelErrorMessageKey(errorCode: string): string {
  switch (errorCode) {
    case "not_found":
      return "region.error.cancel_not_found";
    case "conflict_in_progress":
      return "region.error.cancel_finished";
    default:
      return "region.error.cancel_failed";
  }
}

function getLinkTypeLabel(linkType: "region" | "trunk"): string {
  return linkType === "trunk" ? t("region.link_type.trunk") : t("region.link_type.region");
}

function getLinkCandidates(boot: GameBootstrap) {
  const regionId = boot.play.getNavigation().regionId ?? "MAP-01";
  const snapshot = boot.app.screens.region(regionId).getSnapshot();
  return snapshot.linkCandidates.filter((candidate) => candidate.unlocked)
    .map((candidate) => ({
      candidateId: candidate.candidateId,
      fromCityId: candidate.fromCityId,
      toCityId: candidate.toCityId,
      linkType: candidate.linkType,
      available: candidate.available,
      cost: candidate.cost,
      lossMw: candidate.lossMw,
      label: t("region.candidate.label", {
        type: getLinkTypeLabel(candidate.linkType),
        from: candidate.fromCityName,
        to: candidate.toCityName
      })
    }));
}

function getCancelableLinks(boot: GameBootstrap) {
  const regionId = boot.play.getNavigation().regionId ?? "MAP-01";
  const snapshot = boot.app.screens.region(regionId).getSnapshot();
  return snapshot.gridLinks
    .filter((link) => link.status === "building")
    .map((link) => ({
      linkId: link.linkId,
      fromCityId: link.fromCityId,
      toCityId: link.toCityId,
      linkType: link.linkType,
      buildCost: link.buildCost,
      label: t("region.cancel.label", {
        type: getLinkTypeLabel(link.linkType),
        from: link.fromCityId,
        to: link.toCityId
      })
    }));
}

function ensureSelectedCancelableLink(boot: GameBootstrap) {
  const links = getCancelableLinks(boot);
  if (links.length === 0) {
    selectedCancelableLinkByBoot.delete(boot);
    return null;
  }
  const remembered = selectedCancelableLinkByBoot.get(boot);
  const selected = links.find((link) => link.linkId === remembered) ?? links[0];
  selectedCancelableLinkByBoot.set(boot, selected.linkId);
  return selected;
}

function ensureSelectedCandidate(boot: GameBootstrap) {
  const candidates = getLinkCandidates(boot);
  if (candidates.length === 0) {
    selectedCandidateByBoot.delete(boot);
    return null;
  }
  const remembered = selectedCandidateByBoot.get(boot);
  const selected =
    candidates.find((candidate) => candidate.candidateId === remembered) ??
    candidates.find(
      (candidate) =>
        candidate.fromCityId === DEFAULT_REGION_LINK.fromCityId &&
        candidate.toCityId === DEFAULT_REGION_LINK.toCityId &&
        candidate.linkType === DEFAULT_REGION_LINK.linkType
    ) ??
    candidates[0];
  selectedCandidateByBoot.set(boot, selected.candidateId);
  return selected;
}

export function getRegionHudSelectionSnapshot(boot: GameBootstrap): RegionHudSelectionSnapshot {
  const candidates = getLinkCandidates(boot);
  const selected = ensureSelectedCandidate(boot);
  const cancelableLinks = getCancelableLinks(boot);
  ensureSelectedCancelableLink(boot);
  return {
    candidates,
    selectedCandidateId: selected?.candidateId ?? null,
    cancelableLinks
  };
}

export function formatSelectedRegionLink(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) return null;
  return t("hud.status.region_selected_link_cost", {
    type: getLinkTypeLabel(selected.linkType),
    from: selected.fromCityId,
    to: selected.toCityId,
    cost: selected.cost,
    loss: selected.lossMw
  });
}

export function formatSelectedRegionLinkAction(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) return null;
  if (!selected.available) return t("hud.status.region_link_action_wait");
  if (
    selected.linkType === "trunk" &&
    (selected.fromCityId.startsWith("SUPER-HYDRO") || selected.toCityId.startsWith("SUPER-HYDRO"))
  ) {
    return t("hud.status.region_link_action_super_hydro");
  }
  return selected.linkType === "trunk"
    ? t("hud.status.region_link_action_trunk")
    : t("hud.status.region_link_action_region");
}

export function regionQueueDefaultLink(boot: GameBootstrap): RegionHudActionResult {
  const selected = ensureSelectedCandidate(boot);
  const { fromCityId, toCityId, linkType } = selected ?? DEFAULT_REGION_LINK;
  const regionId = boot.play.getNavigation().regionId ?? "MAP-01";
  const out = boot.app.screens.region(regionId).queueGridLink(fromCityId, toCityId, linkType);
  if (out.result.ok) {
    return toActionResult(
      boot,
      true,
      null,
      linkType === "trunk" ? "region.success.trunk_queued" : "region.success.link_queued"
    );
  }
  return toActionResult(boot, false, out.result.error, resolveQueueErrorMessageKey(out.result.error));
}

export function regionCancelSelectedLink(boot: GameBootstrap): RegionHudActionResult {
  const selected = ensureSelectedCancelableLink(boot);
  if (!selected) {
    return toActionResult(boot, false, "not_found", "region.action.no_cancelable_link");
  }
  const regionId = boot.play.getNavigation().regionId ?? "MAP-01";
  const out = boot.app.screens.region(regionId).cancelGridLink(selected.linkId);
  if (out.result.ok) {
    selectedCancelableLinkByBoot.delete(boot);
    return toActionResult(boot, true, null, "region.success.link_cancelled");
  }
  return toActionResult(boot, false, out.result.error, resolveCancelErrorMessageKey(out.result.error));
}

export function regionCycleLinkCandidate(boot: GameBootstrap): RegionHudActionResult {
  const candidates = getLinkCandidates(boot);
  if (candidates.length === 0) {
    return toActionResult(boot, false, "action_failed", "region.action.no_candidate");
  }
  const current = ensureSelectedCandidate(boot);
  const currentIndex = current
    ? candidates.findIndex((candidate) => candidate.candidateId === current.candidateId)
    : -1;
  const next = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
  selectedCandidateByBoot.set(boot, next.candidateId);
  return toActionResult(
    boot,
    true,
    null,
    candidates.length > 1 ? "region.action.selected_next_candidate" : "region.action.selected_only_candidate"
  );
}
