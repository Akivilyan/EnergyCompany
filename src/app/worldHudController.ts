import { t } from "../i18n/index.js";
import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel, type CityHudActionResult } from "./cityHudController.js";

export interface WorldHudCandidate {
  candidateId: string;
  targetType: "region" | "city";
  regionId: string;
  cityId: string | null;
  displayName: string;
  unlocked: boolean;
  connectionStatus: string;
}

export interface WorldHudSelectionSnapshot {
  candidates: WorldHudCandidate[];
  selectedCandidateId: string | null;
}

const selectedCandidateByBoot = new WeakMap<GameBootstrap, string>();

function toActionResult(
  boot: GameBootstrap,
  ok: boolean,
  errorCode: string | null,
  messageKey: string | null
): CityHudActionResult {
  return {
    ok,
    view: readCityHudViewModel(boot),
    errorCode,
    messageKey
  };
}

function getCandidates(boot: GameBootstrap): WorldHudCandidate[] {
  return boot.app.screens.world.getSnapshot().regions.map((region) => ({
    candidateId:
      region.regionType === "metropolis" && region.centralCityUnlocked
        ? `${region.regionId}:city`
        : `${region.regionId}:region`,
    targetType:
      region.regionType === "metropolis" && region.centralCityUnlocked ? "city" : "region",
    regionId: region.regionId,
    cityId: region.centralCityUnlocked ? region.centralCityId : null,
    displayName: region.displayName,
    unlocked: region.unlocked,
    connectionStatus: region.connectionStatus
  }));
}

function ensureSelectedCandidate(boot: GameBootstrap): WorldHudCandidate | null {
  const candidates = getCandidates(boot);
  if (candidates.length === 0) {
    selectedCandidateByBoot.delete(boot);
    return null;
  }
  const remembered = selectedCandidateByBoot.get(boot);
  const selected =
    candidates.find((candidate) => candidate.candidateId === remembered) ??
    candidates.find((candidate) => candidate.unlocked) ??
    candidates[0];
  selectedCandidateByBoot.set(boot, selected.candidateId);
  return selected;
}

function getFirstAvailableSuperHydroSlot(boot: GameBootstrap): string | null {
  const snapshot = boot.app.screens.world.getSnapshot().superHydro;
  if (!snapshot.unlocked) return null;
  return snapshot.slots.find((slot) => slot.status === "available")?.slotId ?? null;
}

export function getWorldHudSelectionSnapshot(boot: GameBootstrap): WorldHudSelectionSnapshot {
  const candidates = getCandidates(boot);
  const selected = ensureSelectedCandidate(boot);
  return {
    candidates,
    selectedCandidateId: selected?.candidateId ?? null
  };
}

export function formatSelectedWorldCandidate(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) return null;
  return t("hud.status.world_selected_target", {
    type: selected.targetType === "city" ? t("hud.world.target.city") : t("hud.world.target.region"),
    region: selected.displayName
  });
}

export function formatWorldSuperHydroStatus(boot: GameBootstrap): string | null {
  const s = boot.app.screens.world.getSnapshot().superHydro;
  if (s.totalSlots <= 0) return null;
  return t("hud.status.world_super_hydro", {
    state: s.unlocked ? t("hud.world.super_hydro.unlocked") : t("hud.world.super_hydro.locked"),
    finished: s.finishedSlots,
    building: s.buildingSlots,
    total: s.totalSlots,
    output: s.totalOutputMw
  });
}

export function worldCycleTargetCandidate(boot: GameBootstrap): CityHudActionResult {
  const candidates = getCandidates(boot);
  if (candidates.length === 0) {
    return toActionResult(boot, false, "not_found", "world.action.no_candidate");
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
    candidates.length > 1 ? "world.action.selected_next_candidate" : "world.action.selected_only_candidate"
  );
}

export function worldOpenSelectedTarget(boot: GameBootstrap): CityHudActionResult {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) {
    return toActionResult(boot, false, "not_found", "world.action.no_candidate");
  }
  if (!selected.unlocked) {
    return toActionResult(boot, false, "not_unlocked", "world.error.not_unlocked");
  }
  if (selected.targetType === "city" && selected.cityId) {
    boot.play.openScreen("screen_city_detail", selected.cityId, selected.regionId);
    return toActionResult(boot, true, null, "world.success.open_city");
  }
  boot.play.openScreen("screen_region", undefined, selected.regionId);
  return toActionResult(boot, true, null, "world.success.open_region");
}

export function worldQueueSuperHydro(boot: GameBootstrap): CityHudActionResult {
  const slotId = getFirstAvailableSuperHydroSlot(boot);
  if (!slotId) {
    return toActionResult(boot, false, "conflict_in_progress", "world.error.no_super_hydro_slot");
  }
  const out = boot.app.controller.runCommand({ type: "queue_super_hydro", slotId });
  if (!out.ok) {
    const key =
      out.error === "not_unlocked"
        ? "world.error.super_hydro_locked"
        : out.error === "insufficient_funds"
          ? "world.error.super_hydro_funds"
          : "world.error.super_hydro_failed";
    return toActionResult(boot, false, out.error, key);
  }
  return toActionResult(boot, true, null, "world.success.super_hydro_queued");
}
