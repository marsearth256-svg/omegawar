# ATLAS GLOBAL INTELLIGENCE NETWORK (MERN + Gemini)

Production-leaning end-to-end MERN baseline for a 24/7 Geopolitics & Global Current Affairs Intelligence Platform:

- **Backend**: Node.js + Express + MongoDB + Gemini ingestion/analysis + SSE realtime stream
- **Frontend**: React (Vite) dashboard with globe + intel feed

## Prereqs

- Node.js 20+
- MongoDB running locally (or a hosted MongoDB URI)

## Setup

Create `.env` at repo root (or export env vars in your shell).

Start from `.env.example`.

## Run (dev)

Install deps:

```bash
npm install
```

Start backend + frontend:

```bash
npm run dev
```

Defaults:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## What happens

- Backend periodically ingests RSS feeds, calls Gemini to extract structured intel, stores it in MongoDB, and emits `event.created` over **SSE** at `/api/stream`.
- Frontend shows the latest events feed and plots geolocated events on the globe.

## Useful endpoints

- `GET /healthz`
- `GET /api/events?limit=50`
- `POST /api/ingest/run` (manual ingest trigger)
- `GET /api/stream` (SSE stream)

