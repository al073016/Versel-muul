"use client";

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

interface AccessibilityFeature {
  type: "ramp" | "elevator" | "accessible_crossing" | "tactile_paving";
  lat: number;
  lng: number;
  description?: string;
}

interface Props {
  map: mapboxgl.Map | null;
  features: AccessibilityFeature[];
  visible: boolean;
  routeCoordinates?: [number, number][]; // ✅ NUEVO: coordenadas de la ruta
}

export default function AccessibilityFeaturesLayer({
  map,
  features,
  visible,
  routeCoordinates,
}: Props) {
  useEffect(() => {
    if (!map || !visible) return;

    // ✅ Filtrar features que están cerca de la ruta (dentro de 100m)
    const filteredFeatures = routeCoordinates
      ? features.filter((feature) => {
          return routeCoordinates.some((coord) => {
            const lat1 = coord[1];
            const lng1 = coord[0];
            const lat2 = feature.lat;
            const lng2 = feature.lng;
            const distance = Math.sqrt(
              Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)
            );
            return distance < 0.01; // ~1 km en decimal degrees
          });
        })
      : features;

    // Limpiar layer anterior
    if (map.getSource("accessibility-points")) {
      if (map.getLayer("accessibility-points"))
        map.removeLayer("accessibility-points");
      map.removeSource("accessibility-points");
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filteredFeatures.map((f) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [f.lng, f.lat] },
        properties: { type: f.type, description: f.description },
      })),
    };

    map.addSource("accessibility-points", {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: "accessibility-points",
      type: "circle",
      source: "accessibility-points",
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "match",
          ["get", "type"],
          "ramp",
          "#22c55e",
          "elevator",
          "#3b82f6",
          "accessible_crossing",
          "#f59e0b",
          "tactile_paving",
          "#fed000",
          "#999",
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });
  }, [map, features, visible, routeCoordinates]);

  return null;
}