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

export async function geocodeLocation({ name, country }) {
  const q = [name, country].filter(Boolean).join(", ");
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "1");
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "omega-warroom/1.0 (geocode)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`geocode_failed_${res.status}`);
  const data = await res.json();
  const first = Array.isArray(data) && data[0] ? data[0] : null;
  if (!first) return null;
  return { lat: Number(first.lat), lng: Number(first.lon) };
}

