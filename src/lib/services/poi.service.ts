/**
 * Adapter Service for Points of Interest (POIs).
 *
 * DESIGN PATTERN: LOCAL-FIRST ADAPTER with Supabase Fallthrough
 *
 * Strategy:
 * 1. Try Supabase (real DB) — negocios_en_radio() + pois_en_radio() RPCs
 * 2. If Supabase has data → return it (REAL data path)
 * 3. If Supabase is empty or fails → fall back to local seed data (DEMO path)
 *
 * TO FULLY MIGRATE: Once you seed the pois table in Supabase, step 3 will
 * never trigger and you'll be 100% on real data automatically.
 *
 * This service consolidates the logic that was previously split between:
 * - getLocalizedDummyPois() in dummy-data.ts
 * - useNearbySearch hook
 */

import type { POI } from "@/types/database";
import { getLocalizedDummyPois } from "@/lib/dummy-data";

type POIServiceOptions = {
  lat: number;
  lng: number;
  radioKm?: number;
  locale?: string;
};

export const POIService = {
  /**
   * Get POIs near a location.
   * Tries Supabase first; falls back to local seed data if empty.
   *
   * SUPABASE SWAP: Already implemented — just seed the "pois" table in Supabase
   * using the SQL in supabase/schema.sql and this will route to real data automatically.
   */
  async getNearby({ lat, lng, radioKm = 5, locale = "es" }: POIServiceOptions): Promise<POI[]> {
    try {
      // Dynamic import to avoid SSR issues with supabase client
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
        return [...negocios, ...(poisData ?? [])] as POI[];
      }
    } catch (err) {
      console.warn("[POIService] Supabase unavailable, using local seed data:", err);
    }

    // Fallback: local seed data (always has data, works offline)
    const allPois = getLocalizedDummyPois(locale);
    return allPois as POI[];
  },

  /**
   * Get a single POI/negocio by id.
   * Tries Supabase first, then searches local seed.
   *
   * SUPABASE SWAP: The Supabase path already works if the row exists.
   */
  async getById(id: string, locale = "es"): Promise<POI | null> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = await supabase
        .rpc("get_negocio_by_id_or_slug", { p_id_or_slug: id })
        .single();

      if (data) return data as POI;
    } catch {
      // fallthrough to local
    }

    const allPois = getLocalizedDummyPois(locale);
    return (allPois.find(p => p.id === id) ?? null) as POI | null;
  },

  /**
   * "Sorpréndeme" — returns a random selection of nearby POIs.
   * Already real if Supabase has the sorprendeme() RPC seeded.
   */
  async sorprendeme({ lat, lng, locale = "es" }: { lat: number; lng: number; locale?: string }): Promise<POI[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = await supabase.rpc("sorprendeme", { lat, lng, cantidad: 5 });
      if (data && data.length > 0) return data as POI[];
    } catch {
      // fallthrough
    }

    const allPois = getLocalizedDummyPois(locale);
    return allPois.sort(() => Math.random() - 0.5).slice(0, 5) as POI[];
  },
};
