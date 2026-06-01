import { describe, expect, it } from "vitest";
import { probeCocosPreview } from "../../src/app/previewProbe.js";

describe("probeCocosPreview", () => {
  it("reports failure when preview server is not listening", async () => {
    const result = await probeCocosPreview("http://127.0.0.1:59999/", 500);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });
});
