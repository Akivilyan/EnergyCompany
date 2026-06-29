import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadConfigRepoFromJsonDir } from "../../src/app/loadConfigRecords.js";
import { buildConfigBundle, configRepoFromBundle } from "../../src/sim/config/configBundle.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";

const sliceDir = path.join(repoRoot, "docs", "design", "data", "vertical-slice-v0");

describe("buildConfigBundle", () => {
  it("fromBundle matches loadFromConfigDir for vertical slice", () => {
    const fromDir = loadConfigRepoFromConfigDir(sliceDir);
    const fromBundle = configRepoFromBundle(buildConfigBundle(fromDir.bundle));
    expect(fromBundle.bundle.regions.length).toBe(fromDir.bundle.regions.length);
    expect(fromBundle.bundle.cities.length).toBe(fromDir.bundle.cities.length);
    expect(fromBundle.bundle.runConfig.campaign_run_target_months).toBe(
      fromDir.bundle.runConfig.campaign_run_target_months
    );
  });

  it("loadConfigRepoFromJsonDir matches vertical slice records", () => {
    const fromRecords = loadConfigRepoFromJsonDir(sliceDir);
    const fromSlice = loadTestConfig();
    expect(fromRecords.bundle.facilities.length).toBe(fromSlice.bundle.facilities.length);
    expect(fromRecords.bundle.technologies.length).toBe(fromSlice.bundle.technologies.length);
    expect(fromRecords.bundle.gridLoss.loss_regional_mw).toBe(fromSlice.bundle.gridLoss.loss_regional_mw);
    expect(fromRecords.bundle.superHydroSlots.length).toBe(fromSlice.bundle.superHydroSlots.length);
  });

  it("keeps grid loss config aligned with grid design ratios", () => {
    const config = loadTestConfig();
    expect(config.bundle.gridLoss.ordinary_city_reference_demand_mw).toBe(500);
    expect(config.bundle.gridLoss.loss_regional_mw).toBe(125);
    expect(config.bundle.gridLoss.loss_backbone_uhv_mw).toBe(500);
    expect(config.bundle.gridLoss.loss_backbone_pre_uhv_mw).toBe(750);
  });

  it("keeps UHV transmission tech aligned with grid loss config", () => {
    const config = loadTestConfig();
    const uhv = config.getTechnology("uhv_transmission");

    expect(uhv?.company_level_min).toBe(5);
    expect(uhv?.requires_lit).toEqual(["grid_backbone"]);
    expect(uhv?.effect_type).toBe("grid");
    expect(uhv?.effect_target).toBe("trunk");
    expect(uhv?.effect_value.trunk_loss_profile).toBe("uhv");
  });

  it("keeps super hydro slots aligned with strategic map design", () => {
    const config = loadTestConfig();
    const superHydro = config.getTechnology("super_hydro");

    expect(config.bundle.superHydroSlots).toHaveLength(2);
    expect(config.bundle.superHydroSlots.map((slot) => slot.node_id)).toEqual([
      "SUPER-HYDRO-1",
      "SUPER-HYDRO-2"
    ]);
    expect(config.bundle.superHydroSlots.every((slot) => slot.unlock_tech_id === "super_hydro")).toBe(true);
    expect(superHydro?.company_level_min).toBe(5);
    expect(superHydro?.effect_type).toBe("strategic_project");
    expect(superHydro?.effect_value.slot_count).toBe(2);
  });

  it("keeps storage tech effects aligned with design docs", () => {
    const config = loadTestConfig();
    const storage1 = config.getTechnology("storage_system_1");
    const storage2 = config.getTechnology("storage_system_2");
    const storage3 = config.getTechnology("storage_system_3");

    expect(storage1?.effect_type).toBe("storage_buff");
    expect(storage1?.effect_value.storage_mult).toBe(2);
    expect(storage2?.effect_type).toBe("storage_gate");
    expect(storage2?.effect_value.storage_mult).toBeUndefined();
    expect(storage3?.effect_type).toBe("storage_gate");
    expect(storage3?.effect_value.storage_mult).toBeUndefined();
  });

  it("keeps eco sync tech effects aligned with design docs", () => {
    const config = loadTestConfig();
    const ecoThermal = config.getTechnology("eco_thermal");
    const ecoNuclear = config.getTechnology("eco_nuclear");

    expect(ecoThermal?.effect_type).toBe("eco_sync");
    expect(ecoThermal?.effect_target).toBe("all_thermal");
    expect(ecoNuclear?.effect_type).toBe("eco_sync");
    expect(ecoNuclear?.effect_target).toBe("all_nuclear");
  });

  it("keeps smart dispatch regional loss modifier aligned with tech design", () => {
    const config = loadTestConfig();
    const dispatchTech = config.getTechnology("eng_grid_dispatch");

    expect(dispatchTech?.company_level_min).toBe(3);
    expect(dispatchTech?.effect_type).toBe("modifier");
    expect(dispatchTech?.effect_target).toBe("grid_loss");
    expect(dispatchTech?.effect_value.regional_loss_pct).toBe(-10);
  });
});
