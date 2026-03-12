import Parser from "rss-parser";
import pLimit from "p-limit";
import { env } from "../config.js";
import { RawDocument } from "../models/RawDocument.js";
import { Event } from "../models/Event.js";
import { sha256 } from "../utils/hash.js";
import { analyzeDocument } from "./gemini.js";

const parser = new Parser({
  timeout: 15_000,
  headers: {
    "User-Agent": "omega-warroom/1.0 (+ingestion)",
  },
});

function splitFeeds(feedsCsv) {
  return feedsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildContentHash({ sourceUrl, url, title, publishedAt }) {
  return sha256([sourceUrl, url, title, publishedAt ? new Date(publishedAt).toISOString() : ""].join("|"));
}

function buildEventKey({ title, eventType, countries, publishedAt }) {
  const timeBucket = publishedAt ? new Date(publishedAt).toISOString().slice(0, 10) : "unknown-date";
  const primaryCountry = (countries?.[0] ?? "unknown-country").toLowerCase();
  return sha256([eventType, primaryCountry, timeBucket, title.toLowerCase()].join("|")).slice(0, 24);
}

export async function ingestOnce({ geminiModel, broadcast }) {
  const feeds = splitFeeds(env.RSS_FEEDS);
  const feedLimit = pLimit(3);

  const feedResults = await Promise.all(
    feeds.map((feedUrl) =>
      feedLimit(async () => {
        try {
          const feed = await parser.parseURL(feedUrl);
          return { ok: true, feedUrl, items: feed.items ?? [] };
        } catch (err) {
          return { ok: false, feedUrl, error: String(err?.message ?? err) };
        }
      })
    )
  );

  const okFeeds = feedResults.filter((r) => r.ok);
  const items = okFeeds.flatMap((r) => r.items.map((it) => ({ ...it, _sourceUrl: r.feedUrl })));

  let newDocs = 0;
  let newEvents = 0;

  // Keep cost bounded
  const cappedItems = items.slice(0, 30);
  const itemLimit = pLimit(2);

  await Promise.all(
    cappedItems.map((item) =>
      itemLimit(async () => {
        const title = (item.title ?? "").trim();
        const url = (item.link ?? item.guid ?? "").trim();
        const publishedAt = item.isoDate ?? item.pubDate ?? null;
        const sourceUrl = item._sourceUrl;
        const text = (item.contentSnippet ?? item.content ?? title).toString().trim();

        if (!title || !url) return;

        const contentHash = buildContentHash({ sourceUrl, url, title, publishedAt });

        let rawDoc;
        try {
          rawDoc = await RawDocument.create({
            sourceId: sourceUrl,
            sourceUrl,
            url,
            title,
            text: text.slice(0, 12_000),
            publishedAt: publishedAt ? new Date(publishedAt) : undefined,
            contentHash,
            meta: { guid: item.guid, categories: item.categories },
          });
          newDocs += 1;
        } catch (err) {
          // Duplicate contentHash -> already ingested
          if (String(err?.code) === "11000") return;
          throw err;
        }

        const intel = await analyzeDocument({ model: geminiModel, title, text });
        const eventKey = buildEventKey({
          title,
          eventType: intel.eventType,
          countries: intel.countries,
          publishedAt,
        });

        const primaryLocation = intel.locations?.[0]
          ? {
              name: intel.locations[0].name,
              country: intel.locations[0].country,
              lat: intel.locations[0].lat,
              lng: intel.locations[0].lng,
              precision: intel.locations[0].precision ?? "unknown",
            }
          : undefined;

        const upsert = await Event.findOneAndUpdate(
          { eventKey },
          {
            $setOnInsert: {
              eventKey,
              title,
              summaryShort: intel.summaryShort,
              summaryLong: intel.summaryLong,
              eventType: intel.eventType,
              severity: intel.severity,
              riskScore: intel.riskScore,
              confidence: intel.confidence,
              countries: intel.countries,
              actors: intel.actors,
              tags: intel.tags,
              militaryActivityDetected: intel.militaryActivityDetected,
              primaryLocation,
              locations: intel.locations?.map((l) => ({
                name: l.name,
                country: l.country,
                lat: l.lat,
                lng: l.lng,
                precision: l.precision ?? "unknown",
              })),
              sources: [
                {
                  sourceId: sourceUrl,
                  url,
                  publishedAt: publishedAt ? new Date(publishedAt) : undefined,
                  rawDocumentId: rawDoc._id,
                },
              ],
            },
          },
          { upsert: true, new: false }
        );

        if (!upsert) {
          newEvents += 1;
          broadcast?.("event.created", {
            eventKey,
            title,
            summaryShort: intel.summaryShort,
            severity: intel.severity,
            riskScore: intel.riskScore,
            countries: intel.countries,
            primaryLocation,
            createdAt: Date.now(),
          });
        }
      })
    )
  );

  return {
    feedsTotal: feeds.length,
    feedsOk: okFeeds.length,
    itemsSeen: cappedItems.length,
    newDocs,
    newEvents,
    feedErrors: feedResults.filter((r) => !r.ok),
  };
}

