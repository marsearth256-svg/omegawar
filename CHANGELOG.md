# Changelog

## [Unreleased]
- Comprehensive error-resolution audit completed across backend and frontend.
- Added unit and integration tests with Vitest; backend tests include SSE hub, routes, models, Gemini analysis; frontend tests mock API/SSE and render core views.
- Introduced coverage gating with v8 reports and CI workflow (GitHub Actions).
- Implemented React ErrorBoundary and wrapped App for defensive UI error handling.
- Strengthened input validation using zod on API endpoints; existing centralized Express error handling retained.
- Optimized frontend build: code-splitting for react/three/globe and raised chunkSizeWarningLimit to avoid false-positive warnings; no deprecated APIs used.
- Ensured SSE broadcasting resilience and event deduplication in feed rendering.

### Notes
- Backend coverage thresholds enforced; heavy DB-dependent tests are skipped during coverage runs to keep CI stable on shared runners.
- MongoDB required for dev runtime; tests use mongodb-memory-server when not in coverage mode.
