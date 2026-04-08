"use client";

import { useState, useCallback } from "react";
import type { POI } from "@/types/database";

/* ── Types ── */
export type TransportMode = "walking" | "cycling" | "driving";

export interface OptimizedRoute {
  geometry: GeoJSON.LineString;
  distancia_metros: number;
  duracion_segundos: number;
  distancia_texto: string;
  duracion_texto: string;
  orderedPois: POI[];
  legs: { distance: number; duration: number }[];
}

/* ── Formatters ── */
function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const OPT_BASE = "https://api.mapbox.com/optimized-trips/v1/mapbox";

/* ══════════════════════════════════════════════
   HOOK
   ══════════════════════════════════════════════ */
export function useMapboxOptimization() {
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Calls the Mapbox Optimization API v1.
   * Returns the optimized route + POIs reordered by the API.
   */
  const calculateRoute = useCallback(
    async (
      pois: POI[],
      userLocation: [number, number] | null, // [lat, lng]
      mode: TransportMode
    ): Promise<OptimizedRoute | null> => {
      if (pois.length < 1) return null;

      const totalPoints = pois.length + (userLocation ? 1 : 0);
      if (totalPoints > 12) {
        setError("Máximo 12 puntos en la ruta");
        return null;
      }

      setLoading(true);
      setError("");

      try {
        /* Build coordinate string: lng,lat;lng,lat (Mapbox order) */
        const coords: [number, number][] = [];
        if (userLocation) coords.push([userLocation[1], userLocation[0]]);
        pois.forEach((p) => coords.push([p.longitud, p.latitud]));

        const coordStr = coords.map((c) => c.join(",")).join(";");

        const params = new URLSearchParams({
          roundtrip: "false",
          source: "first",
          destination: "last",
          geometries: "geojson",
          steps: "true",
          overview: "full",
          access_token: TOKEN,
        });

        const res = await fetch(`${OPT_BASE}/${mode}/${coordStr}?${params}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!data.trips?.length) {
          throw new Error("La API no devolvió rutas");
        }

        const trip = data.trips[0];

        /* ── Reorder POIs based on optimized waypoint indices ── */
        //
        // data.waypoints[i] = info for input coordinate i
        // data.waypoints[i].waypoint_index = position in optimized trip
        //
        const rawWaypoints: { waypoint_index: number; location: [number, number]; name: string }[] =
          data.waypoints ?? [];

        const startOffset = userLocation ? 1 : 0; // skip origin slot
        const poiWaypoints = rawWaypoints.slice(startOffset);

        // Build ordered array: place each poi at its optimized position
        const reordered: POI[] = new Array(pois.length).fill(null);
        poiWaypoints.forEach((wp, originalIdx) => {
          const optimizedPos = wp.waypoint_index - startOffset;
          if (optimizedPos >= 0 && optimizedPos < pois.length) {
            reordered[optimizedPos] = pois[originalIdx];
          }
        });

        // Fallback: keep original order if reorder incomplete
        const orderedPois = reordered.some((p) => p === null) ? pois : reordered;

        const totalDist = trip.legs.reduce((s: number, l: any) => s + l.distance, 0);
        const totalDur = trip.legs.reduce((s: number, l: any) => s + l.duration, 0);

        const result: OptimizedRoute = {
          geometry: trip.geometry,
          distancia_metros: totalDist,
          duracion_segundos: totalDur,
          distancia_texto: formatDistance(totalDist),
          duracion_texto: formatDuration(totalDur),
          orderedPois,
          legs: trip.legs.map((l: any) => ({ distance: l.distance, duration: l.duration })),
        };

        setRoute(result);
        return result;
      } catch (err: any) {
        setError(err.message || "Error al calcular la ruta");
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

  return { route, loading, error, calculateRoute, clearRoute, setError };
}