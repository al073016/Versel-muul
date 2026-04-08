"use client";

import { useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export function useGlobalSearch() {
  const [buscandoGlobal, setBuscandoGlobal] = useState(false);

  const buscarLugarGlobal = useCallback(
    async (query: string, mapa: mapboxgl.Map | null): Promise<void> => {
      if (!query.trim() || !mapa) return;
      setBuscandoGlobal(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
            `?access_token=${TOKEN}&limit=1&language=es`
        );
        const data = await res.json();
        if (data.features?.length > 0) {
          const [lng, lat] = data.features[0].center;
          mapa.flyTo({ center: [lng, lat], zoom: 14, duration: 2000 });
        }
      } catch (err) {
        console.error("useGlobalSearch:", err);
      } finally {
        setBuscandoGlobal(false);
      }
    },
    []
  );

  return { buscarLugarGlobal, buscandoGlobal };
}