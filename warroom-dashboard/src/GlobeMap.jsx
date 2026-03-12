  import React, { useState, useEffect, useRef } from "react";
  import Globe from "react-globe.gl";

  const AI_SIMULATED_EVENTS = [
    { title: "Simulated Event 1", lat: 40.7128, lng: -74.006, phase: 0.3 },
    { title: "Simulated Event 2", lat: 34.0522, lng: -118.2437, phase: 0.6 },
    { title: "Simulated Event 3", lat: 51.5074, lng: -0.1278, phase: 0.9 },
  ];

  export default function GlobeMap() {
    const globeRef = useRef();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [texture, setTexture] = useState("day");

    const textures = {
      day: "//unpkg.com/three-globe/example/img/earth-day.jpg",
      satellite: "//unpkg.com/three-globe/example/img/earth-satellite.jpg",
      streets: "//unpkg.com/three-globe/example/img/earth-night.jpg"
    };

    // Load live news + AI events every 5s
    useEffect(() => {
      const loadEvents = async () => {
        try {
          const res = await fetch("http://localhost:8000/news");
          const data = await res.json();
          setEvents(data);
        } catch {
          setEvents(AI_SIMULATED_EVENTS);
        }
      };
      loadEvents();
      const interval = setInterval(loadEvents, 5000);
      return () => clearInterval(interval);
    }, []);

    // Pulsing animation
    useEffect(() => {
      const pulseInterval = setInterval(() => {
        setEvents(prev => prev.map(e => ({ ...e, phase: (e.phase + 0.05) % 2 })));
      }, 50);
      return () => clearInterval(pulseInterval);
    }, []);

    const getThreatColor = title => {
      if (title.toLowerCase().includes("war") || title.toLowerCase().includes("conflict")) return "#ff0000";
      if (title.toLowerCase().includes("skirmish") || title.toLowerCase().includes("tension")) return "#ffa500";
      return "#00f";
    };

    return (
      <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
        <div style={{ flex: 1, position: "relative" }}>
          {/* Map style buttons */}
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
            {Object.keys(textures).map(t => (
              <button key={t} onClick={() => setTexture(t)} style={{ margin: 2 }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <Globe
            ref={globeRef}
            globeImageUrl={textures[texture]}
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            pointsData={events}
            pointLat="lat"
            pointLng="lng"
            pointColor={e => getThreatColor(e.title)}
            pointAltitude={e => 0.01 + 0.02 * Math.sin(e.phase * Math.PI * 2)}
            pointRadius={0.3}
            onPointClick={setSelectedEvent}
            polygonsData="//unpkg.com/world-atlas/countries-110m.json"
            polygonCapColor={() => "rgba(0, 150, 255, 0.2)"}  // visible fill
            polygonSideColor={() => "rgba(0,0,0,0.2)"}
            polygonStrokeColor={() => "#222"}                  // visible border
            polygonLabel={d => d.properties.name}             // country labels
            atmosphereAltitude={0.1}
            atmosphereColor="cyan"
            animateIn={true}
          />
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, marginLeft: 10, background: "#f5f7fb", padding: 10, overflowY: "auto" }}>
          <h2>Event Details</h2>
          {selectedEvent ? (
            <div>
              <h3>{selectedEvent.title}</h3>
              <p>Lat: {selectedEvent.lat.toFixed(2)}, Lng: {selectedEvent.lng.toFixed(2)}</p>
            </div>
          ) : (
            <p>Click on a marker to see details</p>
          )}
        </div>
      </div>
    );
  }