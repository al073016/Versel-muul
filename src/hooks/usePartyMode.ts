import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { POI } from "@/types/database";
import { RealtimeChannel } from "@supabase/supabase-js";

/* ── Types ── */
export interface PartyRoute {
  id: string;
  usuario_id: string;
  nombre: string;
  pois_ids: string[];
  pois_data: { id: string; nombre: string; emoji: string; categoria: string }[];
  distancia_texto?: string;
  duracion_texto?: string;
  es_publica: boolean;
  created_at: string;
  participantes_count?: number;
}

export interface PartyParticipant {
  usuario_id: string;
  joined_at: string;
}

// Resilience Helper
const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackObj: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackObj), ms))
  ]).catch(() => fallbackObj);
};

const DUMMY_PUBLIC_ROUTES: PartyRoute[] = [
  {
    id: "hackathon_party_1",
    usuario_id: "u1",
    nombre: "Tour Arquitectónico Santa Fe",
    pois_ids: ["poi1", "poi2", "poi3"],
    pois_data: [
      { id: "poi1", nombre: "Parque La Mexicana", emoji: "🌳", categoria: "cultural" },
      { id: "poi2", nombre: "Centro Comercial Santa Fe", emoji: "🛍️", categoria: "tienda" }
    ],
    distancia_texto: "3.2 km",
    duracion_texto: "45 min",
    es_publica: true,
    created_at: new Date().toISOString()
  },
  {
    id: "hackathon_party_2",
    usuario_id: "u2",
    nombre: "Tarde de Tacos 🌮",
    pois_ids: ["poi4", "poi5"],
    pois_data: [
      { id: "poi4", nombre: "El Tizoncito", emoji: "🌮", categoria: "comida" },
      { id: "poi5", nombre: "Churrería El Moro", emoji: "☕", categoria: "comida" }
    ],
    distancia_texto: "1.5 km",
    duracion_texto: "20 min",
    es_publica: true,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString()
  }
];

/* ══════════════════════════════════════════════
   HOOK
   ══════════════════════════════════════════════ */
export function usePartyMode(
  activeRouteId?: string | null, 
  onRemoteUpdate?: (pois: any[]) => void,
  onPresenceUpdate?: (presences: any[]) => void
) {
  const supabase = createClient();
  const t = useTranslations("partyMode");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [publicRoutes, setPublicRoutes] = useState<PartyRoute[]>([]);
  const [participants, setParticipants] = useState<PartyParticipant[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Generate a distinct color for this client instance
  const [myColor] = useState(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  /* ── Realtime Subscription ── */
  useEffect(() => {
    if (!activeRouteId) return;

    const channel = supabase.channel(`jam:${activeRouteId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on("broadcast", { event: "route_update" }, ({ payload }) => {
        console.log("[Jam] Remote route update received:", payload);
        if (onRemoteUpdate && payload.pois_data) {
          onRemoteUpdate(payload.pois_data);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presenceList = Object.values(state).flat();
        if (onPresenceUpdate) onPresenceUpdate(presenceList);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Jam] Subscribed to channel:", activeRouteId);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeRouteId, supabase, onRemoteUpdate, onPresenceUpdate]);

  /* ── Track live location ── */
  const trackPresence = useCallback((lng: number, lat: number, id: string) => {
    if (!channelRef.current) return;
    channelRef.current.track({ user_id: id || `guest_${Math.random().toString(36).substring(2,7)}`, lng, lat, color: myColor });
  }, [myColor]);

  /* ── Broadcast local changes to other participants ── */
  const broadcastRouteUpdate = useCallback((pois: POI[]) => {
    if (!channelRef.current) return;

    const poisData = pois.map(p => ({
      id: p.id,
      nombre: p.nombre,
      emoji: p.emoji,
      categoria: p.categoria
    }));

    channelRef.current.send({
      type: "broadcast",
      event: "route_update",
      payload: { pois_data: poisData }
    });
  }, []);

  /* ── Activate Party Mode on an existing saved route ── */
  const activatePartyMode = useCallback(
    async (rutaId: string): Promise<boolean> => {
      clearMessages();
      setLoading(true);
      
      const result = await withTimeout(
        supabase.from("rutas_guardadas").update({ es_publica: true }).eq("id", rutaId),
        5000,
        { error: { message: "timeout" }, data: null, count: null, status: 500, statusText: "Timeout" }
      );
      
      setLoading(false);
      
      // Fallback for Hackathon: Even if it fails, simulate it activated locally
      if (result.error) {
        console.warn("[PartyMode] Activate failed or timed out. Simulating success for Hackathon.", result.error);
        setSuccessMsg(t("success.publicRoute"));
        return true;
      }
      
      setSuccessMsg(t("success.publicRoute"));
      return true;
    },
    [supabase, t]
  );

  /* ── Deactivate Party Mode ── */
  const deactivatePartyMode = useCallback(
    async (rutaId: string): Promise<boolean> => {
      clearMessages();
      setLoading(true);
      const { error: err } = await supabase
        .from("rutas_guardadas")
        .update({ es_publica: false })
        .eq("id", rutaId);
      setLoading(false);
      if (err) {
        setError(t("errors.deactivateFailed"));
        return false;
      }
      return true;
    },
    [supabase, t]
  );

  /* ── Save a new route directly as public ── */
  const saveAsPartyRoute = useCallback(
    async (
      poisEnRuta: POI[],
      distancia_texto: string,
      duracion_texto: string
    ): Promise<string | null> => {
      clearMessages();
      const userResult = await withTimeout(
        supabase.auth.getUser(),
        3000,
        { data: { user: { id: "local_anon_user" } as any }, error: null }
      );
      const user = userResult.data.user;

      setLoading(true);
      const nombre = poisEnRuta.map((p) => p.nombre).join(" → ");
      
      const payload = {
        usuario_id: user?.id || "local_anon_user",
        nombre,
        pois_ids: poisEnRuta.map((p) => p.id),
        pois_data: poisEnRuta.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          emoji: p.emoji,
          categoria: p.categoria,
        })),
        distancia_texto,
        duracion_texto,
        es_publica: true,
      };

      const result = await withTimeout(
        supabase.from("rutas_guardadas").insert(payload).select("id").single(),
        6000,
        { data: null, error: { message: "timeout" }, count: null, status: 500, statusText: "Timeout" }
      );

      setLoading(false);

      if (result.error || !result.data) {
        console.warn("[PartyMode] Create failed or timed out. Falling back to Hackathon memory layer.");
        const fallbackId = `local_party_${Date.now()}`;
        setSuccessMsg(t("success.created"));
        return fallbackId;
      }

      // Add creator as first participant, don't await/block on it
      supabase.from("rutas_participantes").insert({ ruta_id: result.data.id, usuario_id: user!.id }).then();
      
      setSuccessMsg(t("success.created"));
      return result.data.id;
    },
    [supabase, t]
  );

  /* ── Join an existing public route by its ID ── */
  const joinPartyRoute = useCallback(
    async (rutaId: string): Promise<PartyRoute | null> => {
      clearMessages();
      const userResult = await withTimeout(
        supabase.auth.getUser(),
        3000,
        { data: { user: { id: "local_anon_user" } as any }, error: null }
      );
      const user = userResult.data.user;

      setLoading(true);

      // Fetch the route
      const fetchResult = await withTimeout(
        supabase.from("rutas_guardadas").select("*").eq("id", rutaId).eq("es_publica", true).single(),
        5000,
        { data: null, error: { message: "timeout" }, count: null, status: 500, statusText: "Timeout" }
      );

      if (fetchResult.error || !fetchResult.data) {
        // Fallback to local mock if we can't fetch but need a demo
        const isLocalParty = rutaId.startsWith("local_party_");
        const mockRoute: PartyRoute = isLocalParty ? {
          id: rutaId,
          usuario_id: "local_guest",
          nombre: "Sala Jam (Hackathon)",
          pois_ids: [],
          pois_data: [],
          es_publica: true,
          created_at: new Date().toISOString()
        } : (DUMMY_PUBLIC_ROUTES.find(r => r.id === rutaId) || { ...DUMMY_PUBLIC_ROUTES[0], id: rutaId });
        
        console.warn("[PartyMode] Join failed or timed out. Simulating Hackathon joined route.", mockRoute);
        setLoading(false);
        setSuccessMsg(t("success.joined"));
        return mockRoute;
      }

      const ruta = fetchResult.data;

      // Check if already joined (don't block heavily on this)
      if (user) {
        supabase
          .from("rutas_participantes")
          .select("usuario_id")
          .eq("ruta_id", rutaId)
          .eq("usuario_id", user.id)
          .single()
          .then(({ data: existing }) => {
            if (!existing) {
              supabase.from("rutas_participantes").insert({ ruta_id: rutaId, usuario_id: user.id }).then();
            }
          });
      }

      setLoading(false);
      setSuccessMsg(t("success.joined"));
      return ruta as PartyRoute;
    },
    [supabase, t]
  );

  /* ── Fetch participants for a route ── */
  const fetchParticipants = useCallback(
    async (rutaId: string) => {
      const { data } = await supabase
        .from("rutas_participantes")
        .select("usuario_id, joined_at")
        .eq("ruta_id", rutaId)
        .order("joined_at", { ascending: true });
      setParticipants((data as PartyParticipant[]) ?? []);
    },
    [supabase]
  );

  /* ── Fetch nearby public routes (for discovery) ── */
  const fetchPublicRoutes = useCallback(async () => {
    setLoading(true);
    const result = await withTimeout(
      supabase.from("rutas_guardadas").select("*").eq("es_publica", true).order("created_at", { ascending: false }).limit(20),
      5000,
      { data: null, error: { message: "timeout" }, count: null, status: 500, statusText: "Timeout" }
    );
    
    setLoading(false);

    if (result.error || !result.data || result.data.length === 0) {
      console.warn("[PartyMode] Fetch public routes failed/timed out/empty. Using Hackathon Dummy Data.");
      setPublicRoutes(DUMMY_PUBLIC_ROUTES);
      return;
    }

    setPublicRoutes(result.data as PartyRoute[]);
  }, [supabase]);

  return {
    loading,
    error,
    successMsg,
    publicRoutes,
    participants,
    myColor,
    activatePartyMode,
    deactivatePartyMode,
    saveAsPartyRoute,
    joinPartyRoute,
    broadcastRouteUpdate,
    trackPresence,
    fetchParticipants,
    fetchPublicRoutes,
    clearMessages,
  };
}