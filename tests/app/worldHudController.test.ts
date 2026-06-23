import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import {
  getWorldHudSelectionSnapshot,
  worldCycleTargetCandidate,
  worldOpenSelectedTarget,
  worldQueueSelectedTrunk,
  worldQueueSuperHydro
} from "../../src/app/worldHudController.js";
import { clientNavOpenWorldMap } from "../../src/app/screenNavController.js";

describe("worldHudController", () => {
  it("blocks opening a locked world target", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenWorldMap(boot);
    worldCycleTargetCandidate(boot);
    worldCycleTargetCandidate(boot);
    worldCycleTargetCandidate(boot);

    const out = worldOpenSelectedTarget(boot);
    expect(out.ok).toBe(false);
    expect(out.errorCode).toBe("not_unlocked");
  });

  it("cycles to unlocked map-02 target and opens region context", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenWorldMap(boot);

    let guard = 0;
    while (
      getWorldHudSelectionSnapshot(boot).candidates.find(
        (candidate) => candidate.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
      )?.regionId !== "MAP-02" &&
      guard < 12
    ) {
      const cycle = worldCycleTargetCandidate(boot);
      expect(cycle.ok).toBe(true);
      guard += 1;
    }

    const selected = getWorldHudSelectionSnapshot(boot).candidates.find(
      (candidate) => candidate.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
    );
    expect(selected?.targetType).toBe("region");

    const open = worldOpenSelectedTarget(boot);
    expect(open.ok).toBe(true);
    expect(boot.play.getNavigation().currentScreen).toBe("screen_region");
    expect(boot.play.getNavigation().regionId).toBe("MAP-02");
  });

  it("queues selected world target trunk from the world hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenWorldMap(boot);

    let guard = 0;
    while (
      getWorldHudSelectionSnapshot(boot).candidates.find(
        (candidate) => candidate.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
      )?.regionId !== "MAP-02" &&
      guard < 12
    ) {
      const cycle = worldCycleTargetCandidate(boot);
      expect(cycle.ok).toBe(true);
      guard += 1;
    }

    const out = worldQueueSelectedTrunk(boot);

    expect(out.ok).toBe(true);
    expect(out.messageKey).toBe("world.success.trunk_queued");
    expect(boot.app.controller.state.gridLinks["CITY-MAP02-01::CITY-START"]?.status).toBe("building");
  });

  it("opens MET-A as a direct city target once unlocked", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenWorldMap(boot);

    let guard = 0;
    while (
      getWorldHudSelectionSnapshot(boot).candidates.find(
        (candidate) => candidate.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
      )?.regionId !== "MET-A" &&
      guard < 12
    ) {
      const cycle = worldCycleTargetCandidate(boot);
      expect(cycle.ok).toBe(true);
      guard += 1;
    }

    const selected = getWorldHudSelectionSnapshot(boot).candidates.find(
      (candidate) => candidate.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
    );
    expect(selected?.targetType).toBe("city");
    expect(selected?.cityId).toBe("CITY-META-01");

    const open = worldOpenSelectedTarget(boot);
    expect(open.ok).toBe(true);
    expect(boot.play.getNavigation().currentScreen).toBe("screen_city_detail");
    expect(boot.play.getNavigation().regionId).toBe("MET-A");
    expect(boot.play.getNavigation().cityId).toBe("CITY-META-01");
  });

  it("opens MET-B as a direct city target once level V is reached", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    clientNavOpenWorldMap(boot);

    let guard = 0;
    while (
      getWorldHudSelectionSnapshot(boot).candidates.find(
        (candidate) => candidate.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
      )?.regionId !== "MET-B" &&
      guard < 16
    ) {
      const cycle = worldCycleTargetCandidate(boot);
      expect(cycle.ok).toBe(true);
      guard += 1;
    }

    const selected = getWorldHudSelectionSnapshot(boot).candidates.find(
      (candidate) => candidate.candidateId === getWorldHudSelectionSnapshot(boot).selectedCandidateId
    );
    expect(selected?.targetType).toBe("city");
    expect(selected?.cityId).toBe("CITY-METB-01");

    const open = worldOpenSelectedTarget(boot);
    expect(open.ok).toBe(true);
    expect(boot.play.getNavigation().currentScreen).toBe("screen_city_detail");
    expect(boot.play.getNavigation().regionId).toBe("MET-B");
    expect(boot.play.getNavigation().cityId).toBe("CITY-METB-01");
  });

  it("queues the first available super hydro slot from the world hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.funds = 200;
    boot.app.controller.state.litTechIds.push("super_hydro");
    clientNavOpenWorldMap(boot);

    const out = worldQueueSuperHydro(boot);

    expect(out.ok).toBe(true);
    expect(out.messageKey).toBe("world.success.super_hydro_queued");
    expect(boot.app.controller.state.superHydros.super_hydro_1?.status).toBe("building");
    expect(boot.app.controller.state.funds).toBe(40);
  });
});
