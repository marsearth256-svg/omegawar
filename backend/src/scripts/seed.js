import { connectDb } from "../db.js";
import { Event } from "../models/Event.js";
import { env } from "../config.js";

async function main() {
  await connectDb(env.MONGODB_URI);
  const doc = await Event.create({
    eventKey: "demo_event_1",
    title: "Demo: Ceasefire Talks Announced",
    summaryShort: "Leaders confirmed new ceasefire negotiation round this week.",
    summaryLong:
      "Officials from both sides agreed to resume talks amid rising tensions. Observers expect gradual de-escalation steps.",
    eventType: "DIPLOMACY",
    severity: "MEDIUM",
    riskScore: 35,
    confidence: 0.6,
    countries: ["Exampleland"],
    actors: ["Example Gov"],
    tags: ["ceasefire", "talks"],
    militaryActivityDetected: false,
    primaryLocation: { name: "Capital City", country: "Exampleland", lat: 12.34, lng: 56.78, precision: "city" },
    sources: [{ sourceId: "seed", url: "https://example.com/demo", publishedAt: new Date() }],
  });
  console.log("seeded", doc._id.toString());
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
