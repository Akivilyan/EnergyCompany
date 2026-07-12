import type { ConfigRepo } from "../config/configRepo.js";
import { deepClone } from "./deepClone.js";
import { err, ok, type SimResult } from "../types/result.js";
import type { GameState } from "../types/gameState.js";
import {
  STATE_SCHEMA_VERSION,
  type SerializedStateEnvelope
} from "../types/storage.js";

export function serializeState(state: GameState): SimResult<SerializedStateEnvelope> {
  if (state.adsRemaining < 0) {
    return err("state_invariant_broken", "adsRemaining must be >= 0", {
      ads_remaining: state.adsRemaining
    });
  }
  return ok({
    schemaVersion: STATE_SCHEMA_VERSION,
    savedAtUnixMs: Date.now(),
    state: deepClone(state)
  });
}

function validateStateReferences(state: GameState, config: ConfigRepo): SimResult<true> {
  for (const cityId of Object.keys(state.cities)) {
    if (!config.getCity(cityId)) {
      return err("state_invariant_broken", "saved city id not found in config", {
        city_id: cityId
      });
    }
  }
  for (const fac of Object.values(state.facilities)) {
    if (!config.getCity(fac.cityId)) {
      return err("state_invariant_broken", "facility references unknown city", {
        facility_id: fac.id,
        city_id: fac.cityId
      });
    }
    if (!config.getFacility(fac.facilityId)) {
      return err("state_invariant_broken", "facility runtime id not found in config", {
        facility_id: fac.id,
        config_facility_id: fac.facilityId
      });
    }
  }
  for (const item of state.constructionQueue) {
    if (!config.getCity(item.cityId) || !config.getFacility(item.facilityId)) {
      return err("state_invariant_broken", "construction queue references missing config id", {
        city_id: item.cityId,
        facility_id: item.facilityId
      });
    }
  }
  return ok(true);
}

function normalizeSameSchemaState(state: GameState): GameState {
  state.gridLinks ??= {};
  state.superHydros ??= {};
  state.researches ??= {};
  state.loans ??= {};
  state.constructionQueue ??= [];
  state.litTechIds ??= [];
  state.activeDebuffs ??= [];
  state.disastersTriggered ??= [];
  state.acknowledgedDisasterSeqs ??= [];
  return state;
}

function validateStateBasics(state: GameState): SimResult<true> {
  if (state.version !== STATE_SCHEMA_VERSION) {
    return err("state_invariant_broken", "unsupported state version", {
      state_version: state.version,
      expected_version: STATE_SCHEMA_VERSION
    });
  }
  if (state.companyLevel < 1) {
    return err("state_invariant_broken", "companyLevel must be >= 1", {
      company_level: state.companyLevel
    });
  }
  if (state.adsRemaining < 0) {
    return err("state_invariant_broken", "adsRemaining must be >= 0", {
      ads_remaining: state.adsRemaining
    });
  }
  if (state.phase === "run_playable" && state.playableSubPhase === null) {
    return err("state_invariant_broken", "playableSubPhase must not be null in run_playable");
  }
  return ok(true);
}

export function deserializeState(
  envelope: SerializedStateEnvelope,
  config: ConfigRepo
): SimResult<GameState> {
  if (envelope.schemaVersion !== STATE_SCHEMA_VERSION) {
    return err("config_missing", "unsupported serialized schema version", {
      schema_version: envelope.schemaVersion,
      expected_schema_version: STATE_SCHEMA_VERSION
    });
  }
  if (!Number.isInteger(envelope.savedAtUnixMs) || envelope.savedAtUnixMs <= 0) {
    return err("state_invariant_broken", "invalid savedAtUnixMs", {
      saved_at_unix_ms: envelope.savedAtUnixMs
    });
  }

  const state = normalizeSameSchemaState(deepClone(envelope.state));
  const basic = validateStateBasics(state);
  if (!basic.ok) return basic;
  const refs = validateStateReferences(state, config);
  if (!refs.ok) return refs;
  return ok(state);
}
