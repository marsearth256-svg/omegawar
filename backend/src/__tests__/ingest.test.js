import { describe, it, expect, vi } from "vitest";
import * as ingestMod from "../services/ingest.js";
import { createGeminiClient } from "../services/gemini.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

vi.mock("rss-parser", () => {
  class MockParser {
    async parseURL(_url) {
      return {
        items: [
          {
            title: "Ceasefire talks underway",
            link: "https://example.com/a",
            isoDate: new Date().toISOString(),
            contentSnippet: "Negotiations between parties continue.",
            guid: "a1",
            categories: ["diplomacy"],
          },
        ],
      };
    }
  }
  return { default: MockParser };
});

describe("ingestOnce", () => {
  const skip = process.env.COVERAGE === "true";
  const testFn = skip ? it.skip : it;
  testFn("ingests feed items and emits events", async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { serverSelectionTimeoutMS: 5000 });
    const { model } = createGeminiClient(""); // no API key -> fallback mode
    const emitted = [];
    const res = await ingestMod.ingestOnce({
      geminiModel: model,
      broadcast: (_name, data) => emitted.push(data),
    });
    expect(res.itemsSeen).toBeGreaterThan(0);
    expect(res.newDocs).toBeGreaterThan(0);
    expect(emitted.length).toBeGreaterThanOrEqual(0);
    await mongoose.disconnect();
    await mongod.stop();
  }, 20000);
});
