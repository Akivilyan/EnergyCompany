import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ConfigRepo,
  createInitialState,
  deserializeState,
  dispatch,
  serializeState
} from "../../src/sim/index.js";


describe("serialization", () => {
  it("serializes and deserializes state round-trip", () => {
    const config = loadTestConfig();
    let state = createInitialState(config, { doctrineId: "tutorial" });
    const build = dispatch(
      state,
      { type: "advance_onboarding" },
      config,
      {
        rng: { nextInt: () => 1 },
        clock: { nowUnixMs: () => Date.now() },
        logger: { info: () => {}, warn: () => {}, error: () => {} }
      }
    );
    expect(build.ok).toBe(true);
    if (!build.ok) return;
    state = build.value.state;

    const saved = serializeState(state);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const loaded = deserializeState(saved.value, config);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.runId).toBe(state.runId);
    expect(loaded.value.onboardingCurrentStepId).toBe("onb_02_build");
  });

  it("rejects schema mismatch", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    const saved = serializeState(state);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const bad = deserializeState({ ...saved.value, schemaVersion: 999 }, config);
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.error).toBe("config_missing");
  });

  it("rejects broken saved references", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    const saved = serializeState(state);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    saved.value.state.cities["CITY-INVALID"] = {
      cityId: "CITY-INVALID",
      demandMw: 1,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: 1
    };
    const loaded = deserializeState(saved.value, config);
    expect(loaded.ok).toBe(false);
    if (loaded.ok) return;
    expect(loaded.error).toBe("state_invariant_broken");
  });
});
