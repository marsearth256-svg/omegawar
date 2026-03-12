import React, { useMemo, useRef, useEffect, useState } from "react";
import Globe from "react-globe.gl";

function getThreatColor(e) {
  const sev = e.severity;
  if (sev === "CRITICAL") return "#ff3b3b";
  if (sev === "HIGH") return "#ffb020";
  if (sev === "MEDIUM") return "#5eead4";
  return "#8cb4ff";
}

export default function GlobeView({ events = [], selectedId, onSelect }) {

  const globeRef = useRef();
  const [hoverD, setHoverD] = useState(null);

  // convert events → globe points
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

  // create threat arcs between events
  const arcs = useMemo(() => {
    if (points.length < 2) return [];

    return points.slice(0, 5).map((p, i) => {
      const target = points[(i + 1) % points.length];

      return {
        startLat: p.lat,
        startLng: p.lng,
        endLat: target.lat,
        endLng: target.lng,
        color: [getThreatColor(p), getThreatColor(target)]
      };
    });
  }, [points]);

  // auto rotate globe
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    globe.pointOfView({ altitude: 2.2 });
  }, []);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>

      <Globe
        ref={globeRef}

        backgroundColor="#020617"

        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

        atmosphereColor="#5eead4"
        atmosphereAltitude={0.22}

        // points
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={(p) => getThreatColor(p)}
        pointAltitude={(p) => (p._id === selectedId ? 0.12 : 0.05)}
        pointRadius={(p) => (p._id === selectedId ? 0.6 : 0.35)}

        onPointClick={(p) =>
          onSelect?.(events.find((e) => e._id === p._id) ?? null)
        }

        onPointHover={setHoverD}

        // animated arcs
        arcsData={arcs}
        arcColor={(a) => a.color}
        arcDashLength={0.4}
        arcDashGap={2}
        arcDashAnimateTime={3000}
        arcStroke={1.6}

        // polygons (countries)
        polygonsData="//unpkg.com/world-atlas/countries-50m.json"
        polygonCapColor={() => "rgba(30, 60, 120, 0.15)"}
        polygonSideColor={() => "rgba(0,0,0,0.15)"}
        polygonStrokeColor={() => "rgba(120,180,255,0.25)"}

        animateIn={true}
      />

      {/* hover tooltip */}
      {hoverD && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            background: "rgba(15,23,42,0.9)",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0",
            fontSize: 13,
            pointerEvents: "none",
          }}
        >
          <strong>{hoverD.title}</strong>
          <div>Severity: {hoverD.severity}</div>
          <div>Risk Score: {hoverD.riskScore ?? "N/A"}</div>
        </div>
      )}

      {/* info panel */}
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(12,16,28,0.75)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          color: "#94a3b8",
          fontSize: 12,
          maxWidth: 380,
        }}
      >
        🌍 Global Threat Monitor  
        <br />
        Showing {points.length} geolocated events.  
        Click a marker to inspect details.
      </div>

    </div>
  );
}
