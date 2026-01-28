"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const LandingMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const styleUrl = "/streets-v2-dark.json";

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    // Get user location first
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      initializeMap([0, 0], 2);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        initializeMap([longitude, latitude], 15.5);
      },
      (err) => {
        console.error("Geolocation error:", err);
        initializeMap([0, 0], 2);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    function initializeMap(center, zoom) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: center,
        zoom: zoom,
        attributionControl: false,
      });

      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      // Wait for all tiles to load
      map.current.on("load", () => {
        // Add a small delay to ensure tiles are rendered
        setTimeout(() => {
          setIsLoading(false);

          // Add marker after map is loaded
          if (center[0] !== 0 || center[1] !== 0) {
            const el = document.createElement("div");
            el.style.width = "18px";
            el.style.height = "18px";
            el.style.backgroundColor = "#4F46E5";
            el.style.border = "3px solid white";
            el.style.borderRadius = "50%";
            el.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

            new maplibregl.Marker(el).setLngLat(center).addTo(map.current);
          }
        }, 100);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-2xl shadow-lg"
        style={{ opacity: isLoading ? 0 : 1, transition: "opacity 0.3s" }}
      />
    </div>
  );
};

export default LandingMap;
