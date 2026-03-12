import { useMemo, useRef } from "react";
import Globe from "react-globe.gl";

function getThreatColor(e) {
  const sev = e.severity;
  if (sev === "CRITICAL") return "#ff4d4d";
  if (sev === "HIGH") return "#ffb020";
  if (sev === "MEDIUM") return "#5eead4";
  return "#8cb4ff";
}

export default function GlobeView({ events, selectedId, onSelect }) {
  const globeRef = useRef();

  const points = useMemo(() => {
    return events
      .map((e) => {
        const loc = e.primaryLocation;
        if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return null;
        return {
          _id: e._id,
          title: e.title,
          severity: e.severity,
          riskScore: e.riskScore,
          lat: loc.lat,
          lng: loc.lng,
        };
      })
      .filter(Boolean);
  }, [events]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={(p) => getThreatColor(p)}
        pointAltitude={(p) => (p._id === selectedId ? 0.08 : 0.03)}
        pointRadius={(p) => (p._id === selectedId ? 0.55 : 0.35)}
        onPointClick={(p) => onSelect?.(events.find((e) => e._id === p._id) ?? null)}
        polygonsData="//unpkg.com/world-atlas/countries-110m.json"
        polygonCapColor={() => "rgba(90, 130, 255, 0.12)"}
        polygonSideColor={() => "rgba(0,0,0,0.2)"}
        polygonStrokeColor={() => "rgba(160, 200, 255, 0.15)"}
        atmosphereAltitude={0.08}
        atmosphereColor="rgba(94, 234, 212, 0.55)"
        animateIn={true}
      />
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(12, 16, 28, 0.72)",
          border: "1px solid var(--panel-border)",
          backdropFilter: "blur(10px)",
          color: "var(--muted)",
          fontSize: 12,
          maxWidth: 360,
        }}
      >
        Showing {points.length} geolocated events. Click a marker to inspect details.
      </div>
    </div>
  );
}

