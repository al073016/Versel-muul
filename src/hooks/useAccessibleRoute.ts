"use client";

import { useState, useCallback } from "react";
import type { POI } from "@/types/database";

/* ══════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════ */
export interface AccessibilityFeature {
  type: "ramp" | "elevator" | "tactile_paving" | "accessible_crossing";
  lat: number;
  lng: number;
  name?: string;
}

export interface AccessibleRoute {
  geometry: GeoJSON.LineString;
  distancia_metros: number;
  duracion_segundos: number;
  distancia_texto: string;
  duracion_texto: string;
  orderedPois: POI[];
  accessibilityFeatures: AccessibilityFeature[];
  accessibilityScore: number; // 0-100
  warnings: string[];         // e.g. "Tramo con pendiente pronunciada"
}

/* ── Formatters ── */
function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function formatDuration(s: number): string {
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

/* ══════════════════════════════════════════════
   OVERPASS API — fetch ramps, elevators, etc.
   Uses OpenStreetMap data tagged for accessibility.
   ══════════════════════════════════════════════ */
async function fetchAccessibilityFeatures(
  bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number }
): Promise<AccessibilityFeature[]> {
  const { minLat, minLng, maxLat, maxLng } = bounds;
  const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;

  // Overpass query: ramps, elevators, tactile paving, accessible crossings
  const query = `
    [out:json][timeout:15];
    (
      node["kerb"="lowered"](${bbox});
      node["kerb"="flush"](${bbox});
      node["wheelchair"="yes"]["kerb"](${bbox});
      node["highway"="elevator"](${bbox});
      node["tactile_paving"="yes"](${bbox});
      node["highway"="crossing"]["crossing"="traffic_signals"]["tactile_paving"="yes"](${bbox});
      node["highway"="crossing"]["wheelchair"="yes"](${bbox});
      way["highway"]["sidewalk"="both"](${bbox});
      way["ramp"="yes"](${bbox});
      way["ramp:wheelchair"="yes"](${bbox});
    );
    out center;
  `.trim();

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) return [];
    const data = await res.json();

    const features: AccessibilityFeature[] = [];

    for (const el of data.elements ?? []) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) continue;

      const tags = el.tags ?? {};
      let type: AccessibilityFeature["type"] = "ramp";

      if (tags.highway === "elevator") type = "elevator";
      else if (tags.tactile_paving === "yes") type = "tactile_paving";
      else if (tags.highway === "crossing") type = "accessible_crossing";
      else if (tags.kerb === "lowered" || tags.kerb === "flush") type = "ramp";
      else if (tags["ramp:wheelchair"] === "yes" || tags.ramp === "yes") type = "ramp";

      features.push({
        type,
        lat,
        lng,
        name: tags.name || tags.description,
      });
    }

    return features;
  } catch {
    // Overpass may be rate-limited — return empty gracefully
    return [];
  }
}

/* ══════════════════════════════════════════════
   MAPBOX DIRECTIONS — accessible walking profile
   
   Mapbox walking profile already avoids stairs.
   We boost it further with:
     - walkway_bias = 1  (prefer dedicated walkways)
     - alley_bias  = -1 (avoid alleys)
     - walking_speed set slower for wheelchair (~2 km/h vs default 4.8)
   ══════════════════════════════════════════════ */
async function fetchAccessibleDirections(
  coords: [number, number][] // [lng, lat] pairs
): Promise<{ geometry: GeoJSON.LineString; distance: number; duration: number } | null> {
  const coordStr = coords.map((c) => c.join(",")).join(";");

  const params = new URLSearchParams({
    geometries: "geojson",
    overview: "full",
    steps: "false",
    // Prefer sidewalks and crosswalks, avoid alleys
    walkway_bias: "1",
    alley_bias: "-1",
    // Wheelchair-realistic walking speed (~2.2 km/h = 0.61 m/s vs default 1.33 m/s)
    walking_speed: "0.75",
    access_token: TOKEN,
  });

  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${coordStr}?${params}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      geometry: route.geometry as GeoJSON.LineString,
      distance: route.distance,
      duration: route.duration,
    };
  } catch {
    return null;
  }
}

/* ── Compute bounding box from a list of [lng, lat] coords ── */
function getBounds(coords: [number, number][]): {
  minLat: number; minLng: number; maxLat: number; maxLng: number;
} {
  const lats = coords.map((c) => c[1]);
  const lngs = coords.map((c) => c[0]);
  const pad = 0.005; // ~500m padding
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

/* ── Score accessibility based on features density ── */
function scoreAccessibility(features: AccessibilityFeature[], distanceM: number): number {
  if (distanceM === 0) return 50;
  // Features per km
  const density = (features.length / distanceM) * 1000;
  // Elevators and ramps worth more
  const elevators = features.filter((f) => f.type === "elevator").length;
  const ramps = features.filter((f) => f.type === "ramp").length;
  const crossings = features.filter((f) => f.type === "accessible_crossing").length;

  const weightedScore = Math.min(100,
    20 + // base score for using accessible routing
    Math.min(40, density * 8) + // density bonus
    Math.min(15, elevators * 5) +
    Math.min(15, ramps * 2) +
    Math.min(10, crossings * 3)
  );

  return Math.round(weightedScore);
}

/* ══════════════════════════════════════════════
   HOOK
   ══════════════════════════════════════════════ */
export function useAccessibleRoute() {
  const [route, setRoute] = useState<AccessibleRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateAccessibleRoute = useCallback(
    async (
      pois: POI[],
      userLocation: [number, number] | null // [lat, lng]
    ): Promise<AccessibleRoute | null> => {
      if (pois.length < 1) {
        setError("Agrega al menos un lugar para calcular la ruta");
        return null;
      }

      setLoading(true);
      setError("");

      try {
        /* Build coordinate array [lng, lat] for Mapbox */
        const coords: [number, number][] = [];
        if (userLocation) coords.push([userLocation[1], userLocation[0]]);
        pois.forEach((p) => coords.push([p.longitud, p.latitud]));

        /* 1. Get accessible directions from Mapbox */
        const directions = await fetchAccessibleDirections(coords);
        if (!directions) {
          setError("No se pudo calcular la ruta accesible. Intenta con menos paradas.");
          return null;
        }

        /* 2. Fetch OSM accessibility features in the bounding box */
        const bounds = getBounds(coords);
        const features = await fetchAccessibilityFeatures(bounds);

        /* 3. Score and build warnings */
        const score = scoreAccessibility(features, directions.distance);
        const warnings: string[] = [];

        if (score < 40) {
          warnings.push("⚠️ Zona con poca infraestructura accesible documentada");
        }
        if (features.filter((f) => f.type === "ramp").length === 0) {
          warnings.push("⚠️ No se detectaron rampas certificadas en este tramo");
        }
        if (directions.distance > 3000) {
          warnings.push("ℹ️ Ruta larga — considera descansos cada 500 m");
        }

        const result: AccessibleRoute = {
          geometry: directions.geometry,
          distancia_metros: directions.distance,
          duracion_segundos: directions.duration,
          distancia_texto: formatDistance(directions.distance),
          duracion_texto: formatDuration(directions.duration),
          orderedPois: pois,
          accessibilityFeatures: features,
          accessibilityScore: score,
          warnings,
        };

        setRoute(result);
        return result;
      } catch (err: any) {
        setError(err.message || "Error al calcular la ruta accesible");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError("");
  }, []);

  return { route, loading, error, calculateAccessibleRoute, clearRoute, setError };
}