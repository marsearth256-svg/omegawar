import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";

function HeatmapLayer({ events }) {
  const map = useMap();

  useEffect(() => {
    if (!map || events.length === 0) return;

    const points = events.map(e => [e.lat, e.lng, e.intensity || 0.5]);

    const heat = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 6,
      gradient: {
        0.2: "blue",
        0.4: "lime",
        0.6: "yellow",
        0.8: "orange",
        1.0: "red"
      }
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [events, map]);

  return null;
}

function WorldMap() {
  const [events, setEvents] = useState([]);
  const [satellite, setSatellite] = useState(false);

  // Fetch live world events from backend AI/news collector
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("http://localhost:5000/api/events");
        const data = await res.json();
        setEvents(data);
      } catch (e) {
        // fallback demo data if backend not running
        setEvents([
          { lat: 48.8566, lng: 2.3522, name: "Europe Alert", intensity: 0.5 },
          { lat: 28.6139, lng: 77.209, name: "South Asia Tension", intensity: 0.8 },
          { lat: 35.6895, lng: 139.6917, name: "Pacific Activity", intensity: 0.6 },
          { lat: 31.5, lng: 34.5, name: "Middle East Conflict", intensity: 1 }
        ]);
      }
    }

    loadEvents();

    // auto refresh every 30 sec
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  function missilePath(start, end) {
    const midLat = (start[0] + end[0]) / 2 + 10;
    const midLng = (start[1] + end[1]) / 2;
    return [start, [midLat, midLng], end];
  }

  function escalationLevel() {
    const high = events.filter(e => e.intensity && e.intensity > 0.7).length;

    if (high > 3) return "CRITICAL";
    if (high > 2) return "HIGH";
    if (high > 1) return "MEDIUM";

    return "LOW";
  }

  function nuclearIndicator(){
    const extreme = events.filter(e => e.intensity >= 0.95).length;

    if(extreme > 0) return "NUCLEAR RISK DETECTED";
    return "No nuclear escalation signals";
  }

  function generateSummary() {
    if (events.length === 0) return "No global events detected.";

    const severe = events.filter(e => e.intensity > 0.7).length;

    return `AI SUMMARY: ${events.length} global events detected. ${severe} high‑intensity conflicts currently active.`;
  }

  function countryRisk() {
    const risk = {};

    events.forEach(e => {
      const key = e.name || "Unknown";
      risk[key] = (risk[key] || 0) + 1;
    });

    return Object.entries(risk)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  function countryStability() {
    const scores = {};

    events.forEach(e => {
      const key = e.name || "Unknown";
      scores[key] = (scores[key] || 0) + (e.intensity || 0.5);
    });

    return Object.entries(scores)
      .map(([c,v]) => [c, (10 - v).toFixed(1)])
      .slice(0,5);
  }

  return (
    <div style={{ position: "relative" }}>

      <div style={{position:"absolute",top:10,right:10,zIndex:1000}}>
        <button onClick={()=>setSatellite(!satellite)} style={{padding:"6px",background:"black",color:"lime",border:"1px solid lime"}}>
          Toggle Satellite
        </button>
      </div>

      {/* Radar sweep overlay */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          border: "3px solid rgba(0,255,0,0.7)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(0deg)",
          animation: "spin 6s linear infinite",
          boxShadow: "0 0 40px rgba(0,255,0,0.5)",
          pointerEvents: "none",
          zIndex: 999
        }}
      />

      <div style={{position:"absolute",top:10,left:10,width:"220px",background:"#111",color:"#0f0",padding:"10px",zIndex:1000}}>
        <strong>GLOBAL ESCALATION</strong>
        <div>{escalationLevel()}</div>
        <div style={{marginTop:"6px",height:"8px",background:"#333"}}>
          <div style={{
            height:"8px",
            width: escalationLevel()==="CRITICAL" ? "100%" : escalationLevel()==="HIGH" ? "75%" : escalationLevel()==="MEDIUM" ? "50%" : "25%",
            background:"red"
          }} />
        </div>
      </div>

      <div style={{position:"absolute",top:90,left:10,width:"220px",background:"#220000",color:"#ff5555",padding:"10px",zIndex:1000}}>
        <strong>NUCLEAR ESCALATION</strong>
        <div>{nuclearIndicator()}</div>
      </div>

      <div style={{position:"absolute",bottom:20,left:20,width:"260px",background:"#111",color:"#0f0",padding:"10px",zIndex:1000}}>
        <strong>AI Event Summary</strong>
        <div>{generateSummary()}</div>

        <br/>
        <strong>Country Risk</strong>
        {countryRisk().map(([c,v],i)=> (
          <div key={i}>{c}: {v}</div>
        ))}

        <br/>
        <strong>Country Stability</strong>
        {countryStability().map(([c,v],i)=> (
          <div key={`stability-${i}`}>{c}: {v}</div>
        ))}
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url={satellite ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />

        <HeatmapLayer events={events} />

        {/* Event markers */}
        {events.map((event, i) => (
          <Marker key={i} position={[event.lat, event.lng]}>
            <Popup>
              <strong>{event.name}</strong>
              <br />
              AI Detected Global Event
            </Popup>
          </Marker>
        ))}

        {/* Conflict heat zones */}
        {events.map((event, i) => (
          <Circle
            key={`heat-${i}`}
            center={[event.lat, event.lng]}
            radius={800000}
            pathOptions={{
              color: "red",
              fillColor: "red",
              fillOpacity: 0.35
            }}
          />
        ))}

        {events.slice(0,4).map((event,i)=>{
          const start=[event.lat,event.lng]
          const end=[event.lat+5,event.lng+10]

          return (
            <Polyline
              key={`missile-${i}`}
              positions={missilePath(start,end)}
              pathOptions={{color:"orange"}}
            />
          )
        })}
      </MapContainer>

      <style>{`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

    </div>
  );
}

export default WorldMap;