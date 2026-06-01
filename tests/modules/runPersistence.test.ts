import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { InMemoryStateStorage } from "../../src/infra/storage/stateStorage.js";
import { createRunPersistence } from "../../src/modules/runPersistence.js";
import { RunController } from "../../src/modules/runController.js";


describe("RunPersistence", () => {
  it("saves and loads run state via storage adapter", () => {
    const controller = createTestController(repoRoot);
    const storage = new InMemoryStateStorage();
    const persistence = createRunPersistence(controller, storage);
    const out = controller.advanceMonths(2);
    expect(out.failed).toBeNull();
    const savedMonth = controller.state.currentMonth;
    const savedFunds = controller.state.funds;
    const save = persistence.save("slot-a");
    expect(save.ok).toBe(true);
    if (!save.ok) return;

    controller.state.currentMonth = 99;
    controller.state.funds = -999;
    const load = persistence.load("slot-a");
    expect(load.ok).toBe(true);
    if (!load.ok) return;
    expect(controller.state.currentMonth).toBe(savedMonth);
    expect(controller.state.funds).toBe(savedFunds);
  });

  it("returns not_found when slot is missing", () => {
    const controller = createTestController(repoRoot);
    const storage = new InMemoryStateStorage();
    const persistence = createRunPersistence(controller, storage);
    const load = persistence.load("missing-slot");
    expect(load.ok).toBe(false);
    if (load.ok) return;
    expect(load.error).toBe("not_found");
    expect(load.context?.slot_id).toBe("missing-slot");
  });

  it("rejects corrupted saved payload by invariant validation", () => {
    const controller = createTestController(repoRoot);
    const storage = new InMemoryStateStorage();
    const persistence = createRunPersistence(controller, storage);
    const save = persistence.save("slot-b");
    expect(save.ok).toBe(true);
    if (!save.ok) return;
    const broken = storage.load("slot-b");
    expect(broken).not.toBeNull();
    if (!broken) return;
    broken.state.adsRemaining = -1;
    storage.save("slot-b", broken);
    const load = persistence.load("slot-b");
    expect(load.ok).toBe(false);
    if (load.ok) return;
    expect(load.error).toBe("state_invariant_broken");
  });
});
