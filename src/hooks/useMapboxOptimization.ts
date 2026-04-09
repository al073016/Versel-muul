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

      // Forzar inicio desde turista
      if (!userLocation) {
        setError("No se detectó tu ubicación en tiempo real.");
        return null;
      }

      const totalPoints = pois.length + 1; // user + pois
      if (totalPoints > 12) {
        setError("Máximo 12 puntos en la ruta");
        return null;
      }

      setLoading(true);
      setError("");

      try {
        const coords: [number, number][] = [];
        coords.push([userLocation[1], userLocation[0]]); // first = source
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
        if (!data.trips?.length) throw new Error("La API no devolvió rutas");

        const trip = data.trips[0];
        const rawWaypoints: { waypoint_index: number }[] = data.waypoints ?? [];

        // Reorden robusto por waypoint_index (ignorando slot 0 = usuario)
        const poiWaypoints = rawWaypoints.slice(1);
        const orderedPois = poiWaypoints
          .map((wp, originalIdx) => ({ wpIndex: wp.waypoint_index, poi: pois[originalIdx] }))
          .sort((a, b) => a.wpIndex - b.wpIndex)
          .map((x) => x.poi);

        const finalPois = orderedPois.length === pois.length ? orderedPois : pois;

        const totalDist = trip.legs.reduce((s: number, l: any) => s + l.distance, 0);
        const totalDur = trip.legs.reduce((s: number, l: any) => s + l.duration, 0);

        const result: OptimizedRoute = {
          geometry: trip.geometry,
          distancia_metros: totalDist,
          duracion_segundos: totalDur,
          distancia_texto: formatDistance(totalDist),
          duracion_texto: formatDuration(totalDur),
          orderedPois: finalPois,
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