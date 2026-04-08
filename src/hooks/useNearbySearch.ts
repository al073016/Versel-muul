"use client";

import { useState, useCallback, useRef } from "react";
import type { POI } from "@/types/database";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍽️", food: "🍜", cafe: "☕", bar: "🍺", bakery: "🥐",
  museum: "🏛️", art: "🎨", park: "🌳", garden: "🌸", monument: "🗿", historic: "🏰",
  shopping: "🛍️", store: "🏪", mall: "🏬", supermarket: "🛒",
  gym: "💪", sport: "⚽", fitness: "🏃",
  hotel: "🏨", hospital: "🏥", pharmacy: "💊", bank: "🏦",
  default: "📍",
};

function emojiForCategory(raw: string): string {
  if (!raw) return CATEGORY_EMOJI.default;
  const lower = raw.toLowerCase();
  const key = Object.keys(CATEGORY_EMOJI).find((k) => lower.includes(k));
  return key ? CATEGORY_EMOJI[key] : CATEGORY_EMOJI.default;
}

function categoriaForRaw(raw: string): string {
  const lower = (raw || "").toLowerCase();
  if (["restaurant","food","cafe","bar","bakery","pizza","sushi","taco","comida","restaurante"].some((k)=>lower.includes(k))) return "comida";
  if (["museum","art","historic","monument","park","garden","gallery","theater","theatre","museo","parque"].some((k)=>lower.includes(k))) return "cultural";
  if (["shop","store","mall","market","boutique","supermarket","tienda"].some((k)=>lower.includes(k))) return "tienda";
  if (["gym","sport","fitness","stadium","pool","deporte"].some((k)=>lower.includes(k))) return "deportes";
  return "servicio";
}

const cache = new Map<string, { data: POI[]; ts: number }>();
const TTL = 90_000;

/**
 * Calculate a bounding box from center + zoom level.
 * Returns [minLng, minLat, maxLng, maxLat] string for Mapbox bbox param.
 */
function getBboxFromCenter(lat: number, lng: number, zoom: number): string {
  // Approximate degrees visible at each zoom level
  // At zoom 14 ≈ 0.02° ≈ 2.2km, at zoom 11 ≈ 0.15° ≈ 17km
  const degreesVisible = 360 / Math.pow(2, zoom);
  const halfSpan = degreesVisible / 2;

  const minLng = lng - halfSpan;
  const maxLng = lng + halfSpan;
  const minLat = lat - halfSpan * 0.6; // lat spans are smaller visually
  const maxLat = lat + halfSpan * 0.6;

  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

export function useNearbySearch() {
  const [buscandoExternos, setBuscandoExternos] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const buscarEnMapbox = useCallback(
    async (center: [number, number], zoom: number): Promise<POI[]> => {
      // center is [lat, lng]
      const [lat, lng] = center;

      const zBucket = Math.round(zoom * 2) / 2;
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${zBucket}`;
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.ts < TTL) return hit.data;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setBuscandoExternos(true);

      try {
        // Use bbox to constrain results to visible map area instead of radius filtering
        const bbox = getBboxFromCenter(lat, lng, zoom);

        // Use a generic search term to find POIs — the geocoding endpoint
        // needs an actual query, not just "point_of_interest.json"
        const searchTerms = [
          "restaurant", "cafe", "museum", "park", "store",
          "bar", "hotel", "pharmacy", "gym", "bakery"
        ];

        // Do parallel searches with a few category terms to get diverse results
        const selectedTerms = searchTerms
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const allFeatures: any[] = [];
        const seenIds = new Set<string>();

        await Promise.all(
          selectedTerms.map(async (term) => {
            const url =
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json` +
              `?proximity=${lng},${lat}` +
              `&bbox=${bbox}` +
              `&types=poi` +
              `&limit=5` +
              `&language=es` +
              `&access_token=${TOKEN}`;

            try {
              const res = await fetch(url, { signal: ctrl.signal });
              if (!res.ok) return;
              const data = await res.json();
              for (const f of data.features ?? []) {
                if (!seenIds.has(f.id)) {
                  seenIds.add(f.id);
                  allFeatures.push(f);
                }
              }
            } catch {
              // individual search failed, continue with others
            }
          })
        );

        const pois: POI[] = allFeatures
          .map((f: any) => {
            const [fLng, fLat] = f.center as [number, number];
            const rawCat: string =
              f.properties?.category || f.properties?.maki || f.place_type?.[0] || "";
            return {
              id: f.id,
              nombre: f.text ?? f.place_name ?? "Sin nombre",
              descripcion: f.place_name ?? "",
              categoria: categoriaForRaw(rawCat),
              latitud: fLat,
              longitud: fLng,
              emoji: emojiForCategory(rawCat),
              photo_url: null,
              horario_apertura: null,
              horario_cierre: null,
              verificado: false,
              precio_rango: null,
              created_at: new Date().toISOString(),
            } as unknown as POI;
          });

        cache.set(cacheKey, { data: pois, ts: Date.now() });
        return pois;
      } catch (err: any) {
        if (err.name === "AbortError") return [];
        console.error("[useNearbySearch]", err);
        return [];
      } finally {
        setBuscandoExternos(false);
      }
    },
    []
  );

  return { buscarEnMapbox, buscandoExternos };
}