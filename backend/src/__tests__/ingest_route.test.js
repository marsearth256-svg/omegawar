import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import * as ingestSvc from "../services/ingest.js";
import { createIngestRouter } from "../routes/ingest.js";

describe("ingest router", () => {
  it("POST /run triggers ingestOnce", async () => {
    const spy = vi.spyOn(ingestSvc, "ingestOnce").mockResolvedValue({
      feedsTotal: 1,
      feedsOk: 1,
      itemsSeen: 1,
      newDocs: 1,
      newEvents: 1,
      feedErrors: [],
    });
    const app = express();
    app.use("/api/ingest", createIngestRouter({ geminiModel: null, broadcast: () => {} }));
    const res = await request(app).post("/api/ingest/run").expect(200);
    expect(res.body.ok).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
