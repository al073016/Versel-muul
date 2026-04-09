"use client";

import { useState, useCallback, useRef } from "react";
import type { POI } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

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
  if (["restaurant","food","cafe","bar","bakery","pizza","sushi","taco","comida","restaurante"].some((k) => lower.includes(k))) return "comida";
  if (["museum","art","historic","monument","park","garden","gallery","theater","theatre","museo","parque"].some((k) => lower.includes(k))) return "cultural";
  if (["shop","store","mall","market","boutique","supermarket","tienda"].some((k) => lower.includes(k))) return "tienda";
  if (["gym","sport","fitness","stadium","pool","deporte"].some((k) => lower.includes(k))) return "deportes";
  return "servicio";
}

/* ── Zoom → approximate visible radius in km ── */
function zoomToRadiusKm(zoom: number): number {
  return Math.max(1, Math.min(50, 100 / Math.pow(2, zoom - 10)));
}

/* ── Bbox helper for Mapbox geocoding ── */
function getBboxFromCenter(lat: number, lng: number, zoom: number): string {
  const degreesVisible = 360 / Math.pow(2, zoom);
  const halfSpan = degreesVisible / 2;
  return `${lng - halfSpan},${lat - halfSpan * 0.6},${lng + halfSpan},${lat + halfSpan * 0.6}`;
}

/* ── Cache ── */
const cache = new Map<string, { data: { supabase: POI[]; mapbox: POI[] }; ts: number }>();
const TTL = 90_000;

/**
 * useNearbySearch
 *
 * Fetches POIs from TWO sources in parallel and merges them:
 *   1. Supabase `pois_en_radio()` RPC — PostGIS spatial query (PRIORITY)
 *   2. Mapbox Geocoding API — fallback for when DB has few/no results nearby
 *
 * Supabase POIs always come first; Mapbox POIs fill in the gaps.
 * Deduplication is by name similarity + coordinate proximity.
 */
export function useNearbySearch() {
  const [buscandoExternos, setBuscandoExternos] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const supabase = createClient();

  const buscarCercanos = useCallback(
    async (
      center: [number, number], // [lat, lng]
      zoom: number
    ): Promise<{ supabasePois: POI[]; mapboxPois: POI[]; merged: POI[] }> => {
      const [lat, lng] = center;
      const radiusKm = zoomToRadiusKm(zoom);

      // ── Cache check ──
      const zBucket = Math.round(zoom * 2) / 2;
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${zBucket}`;
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.ts < TTL) {
        return {
          supabasePois: hit.data.supabase,
          mapboxPois: hit.data.mapbox,
          merged: mergePois(hit.data.supabase, hit.data.mapbox),
        };
      }

      // ── Abort previous request ──
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setBuscandoExternos(true);

      try {
        // ── 1. Supabase: pois_en_radio() RPC (PostGIS) ──
        const supabasePromise = supabase
          .rpc("pois_en_radio", {
            lat,
            lng,
            radio_km: Math.min(radiusKm, 20), // cap at 20km
          })
          .then(({ data, error }) => {
            if (error) {
              console.warn("[useNearbySearch] Supabase RPC error:", error.message);
              return [] as POI[];
            }
            return (data ?? []) as POI[];
          });

        // ── 2. Mapbox Geocoding (supplement/fallback) ──
        const mapboxPromise = fetchMapboxPois(lat, lng, zoom, ctrl.signal);

        // ── Run both in parallel ──
        const [supabasePois, mapboxPois] = await Promise.all([
          supabasePromise,
          mapboxPromise,
        ]);

        // ── Cache ──
        cache.set(cacheKey, {
          data: { supabase: supabasePois, mapbox: mapboxPois },
          ts: Date.now(),
        });

        const merged = mergePois(supabasePois, mapboxPois);
        return { supabasePois, mapboxPois, merged };
      } catch (err: any) {
        if (err.name === "AbortError") {
          return { supabasePois: [], mapboxPois: [], merged: [] };
        }
        console.error("[useNearbySearch]", err);
        return { supabasePois: [], mapboxPois: [], merged: [] };
      } finally {
        setBuscandoExternos(false);
      }
    },
    [supabase]
  );

  return { buscarCercanos, buscandoExternos };
}

/* ══════════════════════════════════════════════
   MAPBOX GEOCODING FALLBACK
   ══════════════════════════════════════════════ */
async function fetchMapboxPois(
  lat: number,
  lng: number,
  zoom: number,
  signal: AbortSignal
): Promise<POI[]> {
  const bbox = getBboxFromCenter(lat, lng, zoom);

  const searchTerms = [
    "restaurant", "cafe", "museum", "park", "store",
    "bar", "hotel", "pharmacy", "gym", "bakery",
  ];
  const selectedTerms = searchTerms.sort(() => Math.random() - 0.5).slice(0, 3);

  const allFeatures: any[] = [];
  const seenIds = new Set<string>();

  await Promise.all(
    selectedTerms.map(async (term) => {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json` +
          `?proximity=${lng},${lat}` +
          `&bbox=${bbox}` +
          `&types=poi` +
          `&limit=5` +
          `&language=es` +
          `&access_token=${TOKEN}`;

        const res = await fetch(url, { signal });
        if (!res.ok) return;
        const data = await res.json();
        for (const f of data.features ?? []) {
          if (!seenIds.has(f.id)) {
            seenIds.add(f.id);
            allFeatures.push(f);
          }
        }
      } catch {
        // individual search failed, continue
      }
    })
  );

  return allFeatures.map((f: any) => {
    const [fLng, fLat] = f.center as [number, number];
    const rawCat: string =
      f.properties?.category || f.properties?.maki || f.place_type?.[0] || "";
    return {
      id: `mapbox_${f.id}`, // prefix to distinguish from Supabase UUIDs
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
      _source: "mapbox", // internal tag
    } as unknown as POI;
  });
}

/* ══════════════════════════════════════════════
   MERGE: Supabase first, then Mapbox (deduplicated)
   ══════════════════════════════════════════════ */
function mergePois(supabasePois: POI[], mapboxPois: POI[]): POI[] {
  // Supabase POIs always come first — they're the verified/registered data
  const merged: POI[] = [...supabasePois];
  const supabaseNames = new Set(
    supabasePois.map((p) => p.nombre.toLowerCase().trim())
  );

  for (const mp of mapboxPois) {
    const nameKey = mp.nombre.toLowerCase().trim();

    // Skip if Supabase already has a POI with a similar name
    if (supabaseNames.has(nameKey)) continue;

    // Skip if a Supabase POI is within ~100m (avoids visual marker overlap)
    const tooClose = supabasePois.some((sp) => {
      const dLat = Math.abs(sp.latitud - mp.latitud);
      const dLng = Math.abs(sp.longitud - mp.longitud);
      return dLat < 0.001 && dLng < 0.001;
    });
    if (tooClose) continue;

    merged.push(mp);
  }

  return merged;
}