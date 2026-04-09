"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { POI } from "@/types/database";
import { haversine } from "@/lib/haversine";

export function useSorprendeme() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calcularRadioDesdeZoom = (zoom: number): number => {
    if (zoom < 10) return 20;
    if (zoom < 12) return 15;
    if (zoom < 14) return 10;
    if (zoom < 16) return 5;
    return 2;
  };

  const generarRutaAleatoria = useCallback(
    async (
      pois: POI[],
      ubicacionUsuario: [number, number] | null,
      opciones: {
        categoria?: string;
        soloAbiertos?: boolean;
        radioKm?: number;
        cantidad?: number;
        currentZoom?: number;
      } = {}
    ): Promise<POI[]> => {
      if (!ubicacionUsuario) {
        setError("Se requiere ubicación");
        return [];
      }

      setLoading(true);
      setError("");

      try {
        const radioFinal =
          opciones.radioKm ??
          calcularRadioDesdeZoom(opciones.currentZoom ?? 14);

        // 1️⃣ Filtrar POIs locales por categoría y distancia
        let resultado: POI[] = pois
          .filter((p) => {
            const dist = haversine(ubicacionUsuario, [p.latitud, p.longitud]);
            const matchCategoria =
              !opciones.categoria || opciones.categoria === "todos" || p.categoria === opciones.categoria;
            const matchDistancia = dist <= radioFinal;
            return matchCategoria && matchDistancia;
          })
          .sort(() => Math.random() - 0.5) // ✅ Shuffle aleatorio SIEMPRE
          .slice(0, opciones.cantidad ?? 8);

        // 2️⃣ Si POIs locales son pocos, agregar de Mapbox
        if (resultado.length < (opciones.cantidad ?? 8)) {
          try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (!mapboxToken) throw new Error("Token Mapbox no configurado");

            const queryTypes = opciones.categoria
              ? opciones.categoria === "comida"
                ? "restaurant,cafe"
                : opciones.categoria === "cultural"
                ? "museum,landmark"
                : opciones.categoria === "tienda"
                ? "shopping"
                : opciones.categoria === "deportes"
                ? "sports"
                : "poi"
              : "poi";

            const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${queryTypes}` +
              `?proximity=${ubicacionUsuario[1]},${ubicacionUsuario[0]}` +
              `&types=poi&limit=20` +
              `&access_token=${mapboxToken}`;

            const mapboxRes = await fetch(mapboxUrl);

            if (mapboxRes.ok) {
              const mapboxData = await mapboxRes.json();
              const poisMapbox: POI[] = (mapboxData.features ?? [])
                .map((f: any) => ({
                  id: `mapbox_${f.id}_${Math.random()}`, // ✅ ID único cada vez
                  nombre: f.text || f.place_name,
                  descripcion: f.place_name,
                  categoria: opciones.categoria || "tienda",
                  latitud: f.geometry.coordinates[1],
                  longitud: f.geometry.coordinates[0],
                  direccion: f.place_name,
                  emoji: "📍",
                  activo: true,
                  verificado: false,
                  horario_apertura: null,
                  horario_cierre: null,
                  precio_rango: null,
                  negocio_id: null,
                  created_at: new Date().toISOString(),
                } as POI))
                .filter(
                  (p: POI) =>
                    !resultado.find((r) => r.id === p.id) &&
                    haversine(ubicacionUsuario, [p.latitud, p.longitud]) <=
                      radioFinal
                )
                .sort(() => Math.random() - 0.5) // ✅ Shuffle Mapbox también
                .slice(0, (opciones.cantidad ?? 8) - resultado.length);

              resultado = [...resultado, ...poisMapbox].slice(0, opciones.cantidad ?? 8);
            }
          } catch (mapboxErr) {
            console.error("Mapbox fallback error:", mapboxErr);
          }
        }

        setLoading(false);
        return resultado;
      } catch (err: any) {
        console.error("Error en generarRutaAleatoria:", err);
        setError(err.message || "Error en sorprendeme");
        setLoading(false);
        return [];
      }
    },
    [supabase]
  );

  return { generarRutaAleatoria, loading, error };
}

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