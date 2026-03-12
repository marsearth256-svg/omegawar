import { useEffect, useMemo, useState } from "react";
import { fetchEvents, streamEvents, getApiBase } from "./api/client";
import GlobeView from "./components/GlobeView";
import EventFeed from "./components/EventFeed";

export default function App() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [status, setStatus] = useState({ connected: false, error: null });

  const selectedId = selected?._id ?? null;

  useEffect(() => {
    let mounted = true;
    fetchEvents({ limit: 50 })
      .then((res) => {
        if (!mounted) return;
        setItems(res.items);
        setNextCursor(res.nextCursor);
        setSelected(res.items[0] ?? null);
      })
      .catch((e) => {
        if (!mounted) return;
        setStatus((s) => ({ ...s, error: String(e?.message ?? e) }));
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const stop = streamEvents({
      onOpen: () => setStatus({ connected: true, error: null }),
      onEvent: (evt) => {
        // only add if not already in list
        setItems((prev) => {
          if (prev.some((p) => p.eventKey === evt.eventKey)) return prev;
          const synthetic = {
            _id: `eventKey:${evt.eventKey}`,
            eventKey: evt.eventKey,
            title: evt.title,
            summaryShort: evt.summaryShort,
            severity: evt.severity,
            riskScore: evt.riskScore,
            countries: evt.countries ?? [],
            primaryLocation: evt.primaryLocation,
            createdAt: new Date().toISOString(),
          };
          return [synthetic, ...prev].slice(0, 200);
        });
      },
      onError: () => setStatus((s) => ({ ...s, connected: false })),
    });
    return stop;
  }, []);

  const hasMore = Boolean(nextCursor);
  async function loadMore() {
    if (!nextCursor) return;
    const res = await fetchEvents({ limit: 50, cursor: nextCursor });
    setItems((prev) => [...prev, ...res.items]);
    setNextCursor(res.nextCursor);
  }

  const details = useMemo(() => {
    if (!selected) return null;
    return {
      title: selected.title,
      summaryShort: selected.summaryShort,
      severity: selected.severity,
      riskScore: selected.riskScore,
      eventType: selected.eventType,
      countries: selected.countries,
      updatedAt: selected.updatedAt,
      createdAt: selected.createdAt,
      sources: selected.sources,
      primaryLocation: selected.primaryLocation,
    };
  }, [selected]);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "grid", gridTemplateColumns: "420px 1fr" }}>
      <div
        style={{
          padding: 14,
          borderRight: "1px solid rgba(120, 150, 255, 0.14)",
          background: "linear-gradient(to bottom, rgba(12, 16, 28, 0.88), rgba(7, 10, 18, 0.9))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>Omega War-Room</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            API {getApiBase()} · {status.connected ? "LIVE" : "OFFLINE"}
          </div>
        </div>

        {status.error ? (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(255, 77, 77, 0.35)",
              background: "rgba(255, 77, 77, 0.08)",
              color: "rgba(255,255,255,0.9)",
              fontSize: 13,
            }}
          >
            {status.error}
          </div>
        ) : null}

        <div style={{ height: "calc(100vh - 62px)" }}>
          <EventFeed
            items={items}
            selectedId={selectedId}
            onSelect={setSelected}
            onLoadMore={loadMore}
            hasMore={hasMore}
          />
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <GlobeView events={items} selectedId={selectedId} onSelect={setSelected} />

        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 420,
            maxHeight: "calc(100vh - 24px)",
            overflow: "auto",
            padding: 12,
            borderRadius: 14,
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ fontSize: 13, letterSpacing: 0.35, color: "var(--muted)" }}>EVENT</div>
          {!details ? (
            <div style={{ marginTop: 8, color: "var(--muted)" }}>Select an event.</div>
          ) : (
            <>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 750, lineHeight: 1.2 }}>{details.title}</div>
              <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, lineHeight: 1.4 }}>
                {details.summaryShort}
              </div>

              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid var(--panel-border)" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Severity</div>
                  <div style={{ marginTop: 4, fontWeight: 700 }}>{details.severity ?? "—"}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid var(--panel-border)" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Risk</div>
                  <div style={{ marginTop: 4, fontWeight: 700 }}>{Math.round(details.riskScore ?? 0)}</div>
                </div>
              </div>

              {details.primaryLocation?.lat != null && details.primaryLocation?.lng != null ? (
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
                  Location: {details.primaryLocation.name ?? "Unknown"} ({details.primaryLocation.lat.toFixed(2)},{" "}
                  {details.primaryLocation.lng.toFixed(2)})
                </div>
              ) : (
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
                  Location: not resolved yet (waiting on AI extraction).
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

