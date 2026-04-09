

import type { POI } from "@/types/database";
import { getLocalizedDummyPois } from "@/lib/dummy-data";

type POIServiceOptions = {
  lat: number;
  lng: number;
  radioKm?: number;
  locale?: string;
};

type NearbyCachePayload = {
  expiresAt: number;
  data: POI[];
};

const NEARBY_CACHE_PREFIX = "muul:nearby:v1";
const NEARBY_CACHE_TTL_MS = 3 * 60 * 1000;
const NEARBY_GRID_DECIMALS = 2;

function quantize(value: number, decimals = NEARBY_GRID_DECIMALS): string {
  return value.toFixed(decimals);
}

function buildNearbyCacheKey({ lat, lng, radioKm, locale }: Required<POIServiceOptions>): string {
  return [
    NEARBY_CACHE_PREFIX,
    quantize(lat),
    quantize(lng),
    Number(radioKm).toFixed(1),
    locale,
  ].join(":");
}

function readNearbyCache(key: string): POI[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as NearbyCachePayload;
    if (!parsed?.expiresAt || !Array.isArray(parsed?.data)) return null;

    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeNearbyCache(key: string, data: POI[]): void {
  if (typeof window === "undefined") return;

  try {
    const payload: NearbyCachePayload = {
      expiresAt: Date.now() + NEARBY_CACHE_TTL_MS,
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota and serialization errors.
  }
}

export const POIService = {
  
  async getNearby({ lat, lng, radioKm = 5, locale = "es" }: POIServiceOptions): Promise<POI[]> {
    const cacheKey = buildNearbyCacheKey({ lat, lng, radioKm, locale });
    const cached = readNearbyCache(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    try {

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const [{ data: negociosData }, { data: poisData }] = await Promise.all([
        supabase.rpc("negocios_en_radio", { lat, lng, radio_km: radioKm }),
        supabase.rpc("pois_en_radio", { lat, lng, radio_km: radioKm }),
      ]);

      const hasRealData = (negociosData?.length ?? 0) + (poisData?.length ?? 0) > 0;

      if (hasRealData) {
        const negocios = (negociosData ?? []).map((n: any) => ({
          ...n,
          categoria: n.categoria ?? "tienda",
          emoji: "🏪",
        }));
        const merged = [...negocios, ...(poisData ?? [])] as POI[];
        writeNearbyCache(cacheKey, merged);
        return merged;
      }
    } catch (err) {
      console.warn("[POIService] Supabase unavailable, using local seed data:", err);
    }


    const allPois = getLocalizedDummyPois(locale);
    writeNearbyCache(cacheKey, allPois as POI[]);
    return allPois as POI[];
  },

  
  async getById(id: string, locale = "es"): Promise<POI | null> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = await supabase
        .rpc("get_negocio_by_id_or_slug", { p_id_or_slug: id })
        .single();

      if (data) return data as POI;
    } catch {

    }

    const allPois = getLocalizedDummyPois(locale);
    return (allPois.find(p => p.id === id) ?? null) as POI | null;
  },

  
  async sorprendeme({ lat, lng, locale = "es" }: { lat: number; lng: number; locale?: string }): Promise<POI[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = await supabase.rpc("sorprendeme", { lat, lng, cantidad: 5 });
      if (data && data.length > 0) return data as POI[];
    } catch {

    }

    const allPois = getLocalizedDummyPois(locale);
    return allPois.sort(() => Math.random() - 0.5).slice(0, 5) as POI[];
  },
};
