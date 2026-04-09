"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { POI } from "@/types/database";

export function useNearbySearch() {
  const supabase = createClient();
  const [buscandoExternos, setBuscandoExternos] = useState(false);

  const buscarCercanos = useCallback(
    async (
      coords: [number, number], // [lat, lng]
      zoom: number
    ): Promise<{ merged: POI[] }> => {
      setBuscandoExternos(true);

      try {
        // ✅ PASO 1: Buscar en Supabase (negocios + POIs verificados)
        const { data: negociosSupabase } = await supabase.rpc(
          "negocios_en_radio",
          {
            lat: coords[0],
            lng: coords[1],
            radio_km: 5,
          }
        );

        const { data: poisSupabase } = await supabase.rpc("pois_en_radio", {
          lat: coords[0],
          lng: coords[1],
          radio_km: 5,
        });

        // ✅ PASO 2: Si hay resultados en Supabase, úsalos
        if ((negociosSupabase?.length ?? 0) > 0 || (poisSupabase?.length ?? 0) > 0) {
          const merged = [
            ...(negociosSupabase ?? []).map((n: any) => ({
              ...n,
              categoria: "tienda",
              emoji: "🏪",
            })),
            ...(poisSupabase ?? []),
          ];
          setBuscandoExternos(false);
          return { merged };
        }

        // ✅ PASO 3: Si NO hay en Supabase, buscar en Mapbox
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const mapboxRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/restaurant,museum,shop/-99.1677,19.4326/` +
            `?proximity=${coords[1]},${coords[0]}&types=poi&limit=10&access_token=${mapboxToken}`
        );

        if (!mapboxRes.ok) throw new Error("Mapbox API error");

        const mapboxData = await mapboxRes.json();
        const poisMapbox = (mapboxData.features ?? []).map((f: any) => ({
          id: `mapbox_${f.id}`,
          nombre: f.text,
          descripcion: f.place_name,
          categoria: "tienda",
          latitud: f.geometry.coordinates[1],
          longitud: f.geometry.coordinates[0],
          emoji: "📍",
          activo: true,
          verificado: false,
        }));

        setBuscandoExternos(false);
        return { merged: poisMapbox };
      } catch (err) {
        console.error("Error en buscarCercanos:", err);
        setBuscandoExternos(false);
        return { merged: [] };
      }
    },
    [supabase]
  );

  return { buscarCercanos, buscandoExternos };
}