import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const intelSchema = z.object({
  summaryShort: z.string().min(1),
  summaryLong: z.string().min(1).optional(),
  eventType: z
    .enum([
      "MILITARY_MOVEMENT",
      "KINETIC_STRIKE",
      "DIPLOMACY",
      "SANCTIONS",
      "ELECTION",
      "CIVIL_UNREST",
      "TERROR",
      "CYBER",
      "DISASTER",
      "ECONOMIC_SHOCK",
      "GENERAL",
    ])
    .default("GENERAL"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("LOW"),
  riskScore: z.number().min(0).max(100).default(10),
  confidence: z.number().min(0).max(1).default(0.5),
  countries: z.array(z.string().min(1)).default([]),
  actors: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  militaryActivityDetected: z.boolean().default(false),
  locations: z
    .array(
      z.object({
        name: z.string().optional(),
        country: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        precision: z.enum(["exact", "city", "region", "country", "unknown"]).default("unknown"),
      })
    )
    .default([]),
});

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, value: null };
  }
}

export function createGeminiClient(apiKey) {
  if (!apiKey) return { model: null };
  const genAI = new GoogleGenerativeAI(apiKey);
  // Keep model configurable later; start with a stable general model.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  return { model };
}

export async function analyzeDocument({ model, title, text }) {
  if (!model) {
    // Degraded mode: keep ingestion running without Gemini credentials.
    const lower = `${title} ${text}`.toLowerCase();
    const military = /war|military|strike|missile|troops|airstrike|drone|artillery/.test(lower);
    const unrest = /protest|riot|unrest|coup/.test(lower);
    const diplomacy = /summit|talks|negotiation|ceasefire|treaty/.test(lower);
    const sanctions = /sanction|embargo|export controls/.test(lower);
    const eventType = military
      ? "MILITARY_MOVEMENT"
      : sanctions
        ? "SANCTIONS"
        : diplomacy
          ? "DIPLOMACY"
          : unrest
            ? "CIVIL_UNREST"
            : "GENERAL";
    const severity = military ? "HIGH" : unrest ? "MEDIUM" : "LOW";
    return intelSchema.parse({
      summaryShort: title,
      summaryLong: (text ?? "").slice(0, 800),
      eventType,
      severity,
      riskScore: military ? 70 : unrest ? 45 : 15,
      confidence: 0.2,
      militaryActivityDetected: military,
      countries: [],
      actors: [],
      tags: [],
      locations: [],
    });
  }

  const prompt = [
    "You are an AI Geopolitics Intelligence Analyst.",
    "Extract structured intelligence from the provided news item.",
    "Return ONLY valid JSON matching this shape:",
    JSON.stringify(intelSchema.shape, null, 2),
    "",
    "Rules:",
    "- Do not include markdown fences.",
    "- If information is unknown, omit fields or use reasonable defaults.",
    "- Countries should be short names (e.g., 'United States', 'Russia').",
    "",
    "News item:",
    `Title: ${title}`,
    `Text: ${text}`,
  ].join("\n");

  const result = await model.generateContent(prompt);
  const responseText = result?.response?.text?.() ?? "";

  // Gemini sometimes returns extra text; attempt best-effort extraction.
  const firstBrace = responseText.indexOf("{");
  const lastBrace = responseText.lastIndexOf("}");
  const jsonCandidate =
    firstBrace !== -1 && lastBrace !== -1 ? responseText.slice(firstBrace, lastBrace + 1) : responseText;

  const parsed = safeJsonParse(jsonCandidate);
  if (!parsed.ok) {
    // Minimal fallback so pipeline stays live.
    return intelSchema.parse({
      summaryShort: title,
      summaryLong: text?.slice?.(0, 600) ?? "",
      eventType: "GENERAL",
      severity: "LOW",
      riskScore: 10,
      confidence: 0.3,
      countries: [],
      actors: [],
      tags: [],
      militaryActivityDetected: false,
      locations: [],
    });
  }

  return intelSchema.parse(parsed.value);
}

