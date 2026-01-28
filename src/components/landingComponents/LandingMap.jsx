"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const LandingMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const styleUrl = "/streets-v2-dark.json";

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [0, 0],
      zoom: 2,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.once("idle", () => {
      if (!navigator.geolocation) {
        console.error("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;

          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15.5,
            speed: 1.2,
            curve: 1.4,
          });

          const el = document.createElement("div");
          el.style.width = "18px";
          el.style.height = "18px";
          el.style.backgroundColor = "#4F46E5";
          el.style.border = "3px solid white";
          el.style.borderRadius = "50%";
          el.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

          new maplibregl.Marker(el)
            .setLngLat([longitude, latitude])
            .addTo(map.current);
        },
        (err) => {
          console.error("Geolocation error:", err);
        },
        { enableHighAccuracy: true },
      );
    });
  }, []);

  return (
    <div ref={mapContainer} className="w-full h-full rounded-2xl shadow-lg" />
  );
};

export default LandingMap;
