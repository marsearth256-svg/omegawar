import express from "express";
import { ingestOnce } from "../services/ingest.js";

export function createIngestRouter({ geminiModel, broadcast }) {
  const router = express.Router();

  router.post("/run", async (req, res, next) => {
    try {
      const result = await ingestOnce({ geminiModel, broadcast });
      res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

