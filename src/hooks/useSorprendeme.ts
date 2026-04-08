"use client";

import { useCallback, useState } from "react";
import type { POI } from "@/types/database";

/* ── Haversine distance in km ── */
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Fisher-Yates shuffle ── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SorprendemeFiltros {
  categoria?: string;          // "todos" | "comida" | "cultural" | ...
  soloAbiertos?: boolean;
  radioKm?: number;            // default 5
  cantidad?: number;           // default 4, max 6
}

/* ── Check if POI is currently open ── */
function isOpenNow(poi: POI): boolean {
  if (!poi.horario_apertura || !poi.horario_cierre) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [aH, aM] = poi.horario_apertura.split(":").map(Number);
  const [cH, cM] = poi.horario_cierre.split(":").map(Number);
  const apertura = aH * 60 + (aM || 0);
  const cierre = cH * 60 + (cM || 0);
  if (cierre < apertura) return cur >= apertura || cur <= cierre;
  return cur >= apertura && cur <= cierre;
}

/* ══════════════════════════════════════════════
   HOOK
   ══════════════════════════════════════════════ */
export function useSorprendeme() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Picks a random set of POIs near the user based on active filters.
   * Returns the selected POIs, or null if not enough candidates.
   */
  const generarRutaAleatoria = useCallback(
    async (
      allPois: POI[],
      userLocation: [number, number] | null, // [lat, lng]
      filtros: SorprendemeFiltros = {}
    ): Promise<POI[] | null> => {
      const {
        categoria = "todos",
        soloAbiertos = false,
        radioKm = 5,
        cantidad = 4,
      } = filtros;

      if (!userLocation) {
        setError("Activa tu ubicación para usar Sorpréndeme");
        return null;
      }

      setLoading(true);
      setError("");

      try {
        // 1. Apply category filter
        let candidatos = allPois;
        if (categoria !== "todos") {
          candidatos = candidatos.filter((p) => p.categoria === categoria);
        }

        // 2. Apply open-now filter
        if (soloAbiertos) {
          candidatos = candidatos.filter(isOpenNow);
        }

        // 3. Filter by radius
        candidatos = candidatos.filter((p) => {
          const dist = haversineKm(userLocation[0], userLocation[1], p.latitud, p.longitud);
          return dist <= radioKm;
        });

        if (candidatos.length < 2) {
          // Relax radius to 10km before giving up
          candidatos = allPois.filter((p) => {
            const cat = categoria === "todos" || p.categoria === categoria;
            const open = !soloAbiertos || isOpenNow(p);
            const dist = haversineKm(userLocation[0], userLocation[1], p.latitud, p.longitud);
            return cat && open && dist <= 10;
          });

          if (candidatos.length < 2) {
            setError("No hay suficientes lugares cerca. Prueba ampliar los filtros.");
            return null;
          }
        }

        // 4. Ensure category diversity: pick at most 2 per category
        const byCategory: Record<string, POI[]> = {};
        candidatos.forEach((p) => {
          if (!byCategory[p.categoria]) byCategory[p.categoria] = [];
          byCategory[p.categoria].push(p);
        });

        const diversified: POI[] = [];
        const shuffledCats = shuffle(Object.keys(byCategory));
        let i = 0;
        while (diversified.length < cantidad && i < 100) {
          const cat = shuffledCats[i % shuffledCats.length];
          const pool = byCategory[cat];
          if (pool.length > 0) {
            const poi = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            diversified.push(poi);
          }
          i++;
        }

        // 5. Fallback: just shuffle and pick
        const selection =
          diversified.length >= 2
            ? diversified.slice(0, cantidad)
            : shuffle(candidatos).slice(0, cantidad);

        return selection;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { generarRutaAleatoria, loading, error, setError };
}