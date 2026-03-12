import express from "express";
import { z } from "zod";
import { Event } from "../models/Event.js";

export const eventsRouter = express.Router();

const listSchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  cursor: z.string().optional(), // createdAt ISO string
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  country: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
});

eventsRouter.get("/", async (req, res, next) => {
  try {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
    }
    const query = parsed.data;

    const mongoQuery = {};
    if (query.severity) mongoQuery.severity = query.severity;
    if (query.country) mongoQuery.countries = query.country;
    if (query.q) mongoQuery.$text = { $search: query.q };
    if (query.cursor) mongoQuery.createdAt = { $lt: new Date(query.cursor) };

    const events = await Event.find(mongoQuery)
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .lean();

    const nextCursor = events.length ? events[events.length - 1].createdAt.toISOString() : null;
    res.json({ items: events, nextCursor });
  } catch (err) {
    next(err);
  }
});

eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ error: "not_found" });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

