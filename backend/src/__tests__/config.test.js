import { describe, it, expect } from "vitest";
import { env } from "../config.js";

describe("config", () => {
  it("parses environment with defaults", () => {
    expect(env.PORT).toBeGreaterThan(0);
    expect(env.CLIENT_ORIGIN).toContain("http://");
    expect(typeof env.RSS_FEEDS).toBe("string");
    expect(env.INGEST_INTERVAL_SECONDS).toBeGreaterThan(0);
  });
});
