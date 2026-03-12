const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function getApiBase() {
  return API_BASE;
}

export async function fetchEvents({ limit = 50, cursor = null } = {}) {
  const url = new URL(`${API_BASE}/api/events`);
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`events_fetch_failed_${res.status}`);
  return res.json();
}

export function streamEvents({ onEvent, onOpen, onError }) {
  const es = new EventSource(`${API_BASE}/api/stream`);
  es.addEventListener("hello", (msg) => onOpen?.(msg));
  es.addEventListener("event.created", (msg) => {
    try {
      onEvent?.(JSON.parse(msg.data));
    } catch {
      // ignore
    }
  });
  es.onerror = (e) => onError?.(e);
  return () => es.close();
}

