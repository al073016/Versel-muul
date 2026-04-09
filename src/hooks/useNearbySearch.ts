"use client";

import { useState, useCallback } from "react";
import type { POI } from "@/types/database";
import { POIService } from "@/lib/services/poi.service";


export function useNearbySearch() {
  const [buscandoExternos, setBuscandoExternos] = useState(false);

  const buscarCercanos = useCallback(
    async (
      coords: [number, number], // [lat, lng]
      _zoom: number,
      locale = "es"
    ): Promise<{ merged: POI[] }> => {
      setBuscandoExternos(true);

      try {
        const merged = await POIService.getNearby({
          lat: coords[0],
          lng: coords[1],
          radioKm: 5,
          locale,
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