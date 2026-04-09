"use client";

import { useState, useCallback } from "react";
import type { POI } from "@/types/database";
import { POIService } from "@/lib/services/poi.service";

/**
 * Hook wrapper around POIService.getNearby().
 * Keeps the same external API as before — components don't need to change.
 *
 * MIGRATION NOTE:
 * The real/dummy routing is handled inside POIService.
 * Once the "pois" table in Supabase has rows, this hook will automatically
 * return real data without any changes here.
 */
export function useNearbySearch() {
  const [buscandoExternos, setBuscandoExternos] = useState(false);

  const buscarCercanos = useCallback(
    async (
      coords: [number, number], // [lat, lng]
      _zoom: number
    ): Promise<{ merged: POI[] }> => {
      setBuscandoExternos(true);

      try {
        const merged = await POIService.getNearby({
          lat: coords[0],
          lng: coords[1],
          radioKm: 5,
        });

        return { merged };
      } catch (err) {
        console.error("[useNearbySearch] Error:", err);
        return { merged: [] };
      } finally {
        setBuscandoExternos(false);
      }
    },
    []
  );

  return { buscarCercanos, buscandoExternos };
}