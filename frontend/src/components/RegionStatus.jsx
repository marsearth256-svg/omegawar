import React from "react";

export default function RegionStatus({ primaryLocation }) {
  const hasCoords =
    primaryLocation && typeof primaryLocation.lat === "number" && typeof primaryLocation.lng === "number";
  const ok = hasCoords && primaryLocation.precision !== "unknown";

  const baseStyle = {
    padding: 10,
    borderRadius: 12,
    border: "1px solid var(--panel-border)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const dotStyle = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: ok ? "var(--ok)" : "var(--danger)",
    boxShadow: ok ? "0 0 14px var(--ok)" : "0 0 14px var(--danger)",
  };

  return (
    <div style={baseStyle}>
      <div style={dotStyle} />
      {ok ? (
        <div style={{ fontSize: 12 }}>
          Region: {primaryLocation.name ?? primaryLocation.country ?? "Unknown"} ({primaryLocation.lat.toFixed(2)},{" "}
          {primaryLocation.lng.toFixed(2)})
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Region unresolved ·{" "}
          <a href="https://docs.local/fix-configuration" style={{ color: "var(--accent)" }}>
            Fix Configuration
          </a>
        </div>
      )}
    </div>
  );
}
