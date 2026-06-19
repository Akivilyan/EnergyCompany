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
  }>;
  selectedCandidateId: string | null;
}

const selectedCandidateByBoot = new WeakMap<GameBootstrap, string>();

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

function getLinkTypeLabel(linkType: "region" | "trunk"): string {
  return linkType === "trunk" ? t("region.link_type.trunk") : t("region.link_type.region");
}

function getLinkCandidates(boot: GameBootstrap) {
  const regionId = boot.play.getNavigation().regionId ?? "MAP-01";
  return boot.app.screens.region(regionId)
    .getSnapshot()
    .linkCandidates.filter((candidate) => candidate.unlocked)
    .map((candidate) => ({
      candidateId: candidate.candidateId,
      fromCityId: candidate.fromCityId,
      toCityId: candidate.toCityId,
      linkType: candidate.linkType,
      available: candidate.available,
      label: t("region.candidate.label", {
        type: getLinkTypeLabel(candidate.linkType),
        from: candidate.fromCityName,
        to: candidate.toCityName
      })
    }));
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
  return {
    candidates,
    selectedCandidateId: selected?.candidateId ?? null
  };
}

export function formatSelectedRegionLink(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) return null;
  return t("hud.status.region_selected_link", {
    type: getLinkTypeLabel(selected.linkType),
    from: selected.fromCityId,
    to: selected.toCityId
  });
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
