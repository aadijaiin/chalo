"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const LandingMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("Getting location...");
  const watchId = useRef(null);
  const mapLoaded = useRef(false);

  const styleUrl = "/streets-v2-dark.json";

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    // Check if on HTTPS or localhost
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      console.warn(
        "⚠️ Geolocation requires HTTPS! Running on HTTP will give inaccurate results.",
      );
      setLocationStatus("⚠️ HTTPS required for accurate location");
    }

    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      initializeMap([0, 0], 2);
      return;
    }

    let bestAccuracy = Infinity;
    let bestPosition = null;
    let initialized = false;
    let updateCount = 0;

    // Use watchPosition for better accuracy
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;
        updateCount++;

        console.log(`📍 Position update #${updateCount}:`, {
          longitude: longitude.toFixed(6),
          latitude: latitude.toFixed(6),
          accuracy: Math.round(accuracy) + "m",
          improved: accuracy < bestAccuracy,
          timestamp: new Date(pos.timestamp).toLocaleTimeString(),
        });

        // Warn if accuracy seems fake
        if (accuracy === 1) {
          console.warn(
            "⚠️ Accuracy of 1m is likely not real GPS data. You may need HTTPS for true GPS.",
          );
        }

        // Keep track of best position
        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy;
          bestPosition = { longitude, latitude };

          setLocationStatus(
            `Accuracy: ${Math.round(accuracy)}m (Update #${updateCount})`,
          );

          // Initialize map with first position
          if (!initialized) {
            initialized = true;
            initializeMap([longitude, latitude], 15.5);
          } else if (mapLoaded.current) {
            // Update marker position if map is ready
            updateMarkerPosition(longitude, latitude, accuracy);
          }
        }

        // Stop watching after 10 updates or good accuracy
        if ((updateCount >= 10 || accuracy < 20) && watchId.current) {
          navigator.geolocation.clearWatch(watchId.current);
          console.log(
            "✓ Stopped watching - final accuracy:",
            Math.round(bestAccuracy) + "m",
          );
        }
      },
      (err) => {
        console.error("❌ Geolocation error:", {
          code: err.code,
          message: err.message,
          // Error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
        });
        setLocationStatus("Location unavailable");

        if (!initialized) {
          initialized = true;
          initializeMap([0, 0], 2);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 27000,
        maximumAge: 0,
      },
    );

    function updateMarkerPosition(lng, lat, accuracy) {
      if (!map.current || !mapLoaded.current) return;

      // Update or create marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement("div");
        el.className = "user-location-marker";
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.backgroundColor = "#4F46E5";
        el.style.border = "3px solid white";
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

        marker.current = new maplibregl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current);
      }

      // Update accuracy circle
      if (map.current.getSource("accuracy-circle")) {
        map.current.getSource("accuracy-circle").setData({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        });
      } else {
        map.current.addSource("accuracy-circle", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          },
        });

        // Calculate pixel radius from meters
        const metersPerPixel =
          (156543.03392 * Math.cos((lat * Math.PI) / 180)) /
          Math.pow(2, map.current.getZoom());
        const radius = Math.max(accuracy / metersPerPixel, 10);

        map.current.addLayer({
          id: "accuracy-circle",
          type: "circle",
          source: "accuracy-circle",
          paint: {
            "circle-radius": radius,
            "circle-color": "#4F46E5",
            "circle-opacity": 0.1,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#4F46E5",
            "circle-stroke-opacity": 0.4,
          },
        });
      }

      // Smoothly move to new position
      map.current.easeTo({
        center: [lng, lat],
        duration: 1000,
      });
    }

    function initializeMap(center, zoom) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: center,
        zoom: zoom,
        attributionControl: false,
      });

      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      map.current.on("load", () => {
        mapLoaded.current = true;

        setTimeout(() => {
          setIsLoading(false);
          updateMarkerPosition(center[0], center[1], bestAccuracy);
        }, 100);
      });
    }

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
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
            <p className="text-white text-sm">{locationStatus}</p>
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
