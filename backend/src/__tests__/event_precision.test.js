import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Event } from "../models/Event.js";

describe("Event precision values", () => {
  it("rejects invalid precision", async () => {
    const doc = new Event({
      eventKey: "precision_test",
      title: "t",
      summaryShort: "s",
      eventType: "GENERAL",
      severity: "LOW",
      riskScore: 1,
      confidence: 0.5,
      countries: [],
      primaryLocation: { name: "X", country: "Y", lat: 1, lng: 2, precision: "invalid" },
    });
    let err = null;
    try {
      await doc.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeTruthy();
    await mongoose.connection.close().catch(() => {});
  });
});
