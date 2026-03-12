import { describe, it, expect } from "vitest";
import { analyzeDocument, createGeminiClient } from "../services/gemini.js";

describe("gemini analyzeDocument", () => {
  it("falls back gracefully without API key", async () => {
    const { model } = createGeminiClient("");
    const intel = await analyzeDocument({
      model,
      title: "Military convoy spotted near border",
      text: "Troops and artillery moving across the region.",
    });
    expect(intel.summaryShort.length).toBeGreaterThan(0);
    expect(["MILITARY_MOVEMENT", "GENERAL"]).toContain(intel.eventType);
    expect(typeof intel.riskScore).toBe("number");
  });
});
