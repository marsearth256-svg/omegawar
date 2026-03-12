import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config.js";
import { connectDb } from "./db.js";
import { createSseHub } from "./realtime/sse.js";
import { createGeminiClient } from "./services/gemini.js";
import { ingestOnce } from "./services/ingest.js";
import { eventsRouter } from "./routes/events.js";
import { createIngestRouter } from "./routes/ingest.js";

const app = express();
app.disable("x-powered-by");

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: false,
  })
);
app.use(morgan("tiny"));

const sse = createSseHub();
const { model: geminiModel } = createGeminiClient(env.GEMINI_API_KEY);

app.get("/healthz", (req, res) => res.json({ ok: true }));
app.get("/readyz", (req, res) => res.json({ ok: true }));

app.get("/api/stream", sse.handler);
app.use("/api/events", eventsRouter);
app.use("/api/ingest", createIngestRouter({ geminiModel, broadcast: sse.broadcast }));

app.use((err, req, res, _next) => {
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = status === 500 ? "internal_error" : String(err?.message ?? "error");
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
});

async function main() {
  await connectDb(env.MONGODB_URI);

  // Basic interval scheduler (kept simple, no separate worker yet).
  const intervalMs = env.INGEST_INTERVAL_SECONDS * 1000;
  let running = false;

  async function tick() {
    if (running) return;
    running = true;
    try {
      const result = await ingestOnce({ geminiModel, broadcast: sse.broadcast });
      console.log("ingest.tick", result);
    } catch (e) {
      console.error("ingest.tick.failed", e);
    } finally {
      running = false;
    }
  }

  setInterval(tick, intervalMs);
  // Kick once on boot
  tick();

  app.listen(env.PORT, () => {
    console.log(`api listening on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  console.error("fatal", e);
  process.exit(1);
});

