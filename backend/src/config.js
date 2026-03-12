import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(8000),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  // Allow boot without the key; AI extraction degrades gracefully.
  GEMINI_API_KEY: z.string().optional().default(""),
  RSS_FEEDS: z
    .string()
    .min(1)
    .default(
      "https://feeds.bbci.co.uk/news/world/rss.xml,https://www.aljazeera.com/xml/rss/all.xml,https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
    ),
  INGEST_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
});

export const env = envSchema.parse(process.env);

