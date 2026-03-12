import { describe, it, expect, vi } from "vitest";

vi.mock("@google/generative-ai", () => {
  class GoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: async () => ({
          response: {
            text: () =>
              JSON.stringify({
                summaryShort: "Parsed",
                summaryLong: "Long summary",
                eventType: "DIPLOMACY",
                severity: "LOW",
                riskScore: 12,
                confidence: 0.6,
                countries: ["Example"],
                actors: ["Actor"],
                tags: ["tag"],
                militaryActivityDetected: false,
                locations: [],
              }),
          },
        }),
      };
    }
  }
  return { GoogleGenerativeAI };
});

import { analyzeDocument, createGeminiClient } from "../services/gemini.js";

describe("gemini model path", () => {
  it("parses model JSON response", async () => {
    const { model } = createGeminiClient("fake");
    const intel = await analyzeDocument({ model, title: "T", text: "X" });
    expect(intel.eventType).toBe("DIPLOMACY");
    expect(intel.summaryShort).toBe("Parsed");
  });
});
