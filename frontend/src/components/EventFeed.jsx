function severityColor(sev) {
  if (sev === "CRITICAL") return "var(--danger)";
  if (sev === "HIGH") return "var(--warn)";
  if (sev === "MEDIUM") return "rgba(94, 234, 212, 0.9)";
  return "rgba(140, 180, 255, 0.9)";
}

export default function EventFeed({ items, selectedId, onSelect, onLoadMore, hasMore }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, letterSpacing: 0.4, color: "var(--muted)" }}>INTELLIGENCE FEED</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Latest events</div>
        </div>
        <button
          onClick={onLoadMore}
          disabled={!hasMore}
          style={{
            border: "1px solid var(--panel-border)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--text)",
            padding: "8px 10px",
            borderRadius: 10,
            cursor: hasMore ? "pointer" : "not-allowed",
          }}
        >
          Load more
        </button>
      </div>

      <div style={{ marginTop: 12, overflowY: "auto", paddingRight: 6 }}>
        {items.length === 0 ? (
          <div style={{ color: "var(--muted)", padding: "10px 0" }}>No events yet. Ingestion is running.</div>
        ) : (
          items.map((e) => (
            <button
              key={e._id}
              onClick={() => onSelect(e)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 10px",
                marginBottom: 8,
                borderRadius: 12,
                border: e._id === selectedId ? "1px solid rgba(94, 234, 212, 0.45)" : "1px solid var(--panel-border)",
                background: e._id === selectedId ? "rgba(94,234,212,0.08)" : "rgba(255,255,255,0.03)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: severityColor(e.severity),
                    boxShadow: `0 0 18px ${severityColor(e.severity)}`,
                  }}
                />
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {e.severity} · risk {Math.round(e.riskScore)}
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 650, lineHeight: 1.25 }}>{e.title}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)", lineHeight: 1.35 }}>
                {e.summaryShort}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

