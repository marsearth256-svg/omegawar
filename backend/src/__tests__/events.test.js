import { beforeAll, afterAll, describe, it, expect } from "vitest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { eventsRouter } from "../routes/events.js";
import { Event } from "../models/Event.js";
import request from "supertest";

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { serverSelectionTimeoutMS: 5000 });

  app = express();
  app.use(express.json());
  app.use("/api/events", eventsRouter);

  await Event.create({
    eventKey: "testkey",
    title: "Test Event",
    summaryShort: "Summary",
    eventType: "GENERAL",
    severity: "LOW",
    riskScore: 10,
    confidence: 0.5,
    countries: ["Testland"],
    actors: ["Actor"],
    tags: ["tag"],
    militaryActivityDetected: false,
    sources: [],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe("events router", () => {
  it("lists events", async () => {
    const res = await request(app).get("/api/events").expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("filters by country", async () => {
    const res = await request(app).get("/api/events?country=Testland").expect(200);
    expect(res.body.items.every((e) => e.countries.includes("Testland"))).toBe(true);
  });
});
