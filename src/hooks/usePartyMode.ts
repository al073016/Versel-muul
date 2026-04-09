import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { POI } from "@/types/database";
import { RealtimeChannel } from "@supabase/supabase-js";

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

const withTimeout = <T>(promise: PromiseLike<T>, ms: number, fallbackObj: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackObj), ms))
  ]).catch(() => fallbackObj);
};

const TIMEOUT_ERROR = {
  message: "timeout",
  details: "Operation timed out",
  hint: "Try again",
  code: "TIMEOUT",
  name: "TimeoutError",
  success: false,
  toJSON() {
    return {
      message: this.message,
      details: this.details,
      hint: this.hint,
      code: this.code,
      name: this.name
    };
  }
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
  const [myColor] = useState(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"));

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  useEffect(() => {
    if (!activeRouteId) return;

    const channel = supabase.channel(`jam:${activeRouteId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on("broadcast", { event: "route_update" }, ({ payload }) => {
        if (onRemoteUpdate && payload.pois_data) {
          onRemoteUpdate(payload.pois_data);
        }
      })
      .on("broadcast", { event: "sync_request" }, () => {
        if (onSyncRequestRef.current) onSyncRequestRef.current();
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presenceList = Object.values(state).flat();
        if (onPresenceUpdate) onPresenceUpdate(presenceList);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeRouteId, supabase, onRemoteUpdate, onPresenceUpdate]);

  const onSyncRequestRef = useRef<(() => void) | null>(null);

  const sendSyncRequest = useCallback(() => {
    if (!channelRef.current) return;
    setTimeout(() => {
      channelRef.current?.send({ type: "broadcast", event: "sync_request", payload: {} });
    }, 800);
  }, []);

  const trackPresence = useCallback((lng: number, lat: number, id: string) => {
    if (!channelRef.current) return;
    channelRef.current.track({ user_id: id || `guest_${Math.random().toString(36).substring(2, 7)}`, lng, lat, color: myColor });
  }, [myColor]);

  const broadcastRouteUpdate = useCallback((pois: POI[]) => {
    if (!channelRef.current) return;
    const poisData = pois.map(p => ({
      id: p.id,
      nombre: p.nombre,
      emoji: p.emoji,
      categoria: p.categoria,
      latitud: p.latitud,
      longitud: p.longitud,
      direccion: p.direccion || "",
    }));
    channelRef.current.send({
      type: "broadcast",
      event: "route_update",
      payload: { pois_data: poisData }
    });
  }, []);

  const activatePartyMode = useCallback(
    async (rutaId: string): Promise<boolean> => {
      clearMessages();
      setLoading(true);
      const result = await withTimeout(
        supabase.from("rutas_guardadas").update({ es_publica: true }).eq("id", rutaId).then(r => r),
        5000,
        { error: TIMEOUT_ERROR, data: null, count: null, status: 500, statusText: "Timeout", success: false } as any
      );
      setLoading(false);
      if (result.error) {
        setSuccessMsg(t("success.publicRoute"));
        return true;
      }
      setSuccessMsg(t("success.publicRoute"));
      return true;
    },
    [supabase, t]
  );

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
        supabase.from("rutas_guardadas").insert(payload).select("id").single().then(r => r),
        6000,
        { data: null, error: TIMEOUT_ERROR, count: null, status: 500, statusText: "Timeout", success: false } as any
      );

      setLoading(false);

      if (result.error || !result.data) {
        const fallbackId = `local_party_${Date.now()}`;
        setSuccessMsg(t("success.created"));
        return fallbackId;
      }

      supabase.from("rutas_participantes").insert({ ruta_id: result.data.id, usuario_id: user!.id }).then();
      setSuccessMsg(t("success.created"));
      return result.data.id;
    },
    [supabase, t]
  );

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

      const fetchResult = await withTimeout(
        supabase.from("rutas_guardadas").select("*").eq("id", rutaId).eq("es_publica", true).single().then(r => r),
        5000,
        { data: null, error: TIMEOUT_ERROR, count: null, status: 500, statusText: "Timeout", success: false } as any
      );

      if (fetchResult.error || !fetchResult.data) {
        const isLocalParty = rutaId.startsWith("local_party_");
        const mockRoute: PartyRoute = isLocalParty ? {
          id: rutaId,
          usuario_id: "local_guest",
          nombre: "Sala Jam",
          pois_ids: [],
          pois_data: [],
          es_publica: true,
          created_at: new Date().toISOString()
        } : (DUMMY_PUBLIC_ROUTES.find(r => r.id === rutaId) || { ...DUMMY_PUBLIC_ROUTES[0], id: rutaId });
        setLoading(false);
        setSuccessMsg(t("success.joined"));
        return mockRoute;
      }

      const ruta = fetchResult.data;

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

  const fetchPublicRoutes = useCallback(async () => {
    setLoading(true);
    const result = await withTimeout(
      supabase.from("rutas_guardadas").select("*").eq("es_publica", true).order("created_at", { ascending: false }).limit(20).then(r => r),
      5000,
      { data: null, error: TIMEOUT_ERROR, count: null, status: 500, statusText: "Timeout", success: false } as any
    );
    setLoading(false);
    if (result.error || !result.data || result.data.length === 0) {
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
    onSyncRequestRef,
    activatePartyMode,
    deactivatePartyMode,
    saveAsPartyRoute,
    joinPartyRoute,
    broadcastRouteUpdate,
    trackPresence,
    sendSyncRequest,
    fetchParticipants,
    fetchPublicRoutes,
    clearMessages,
  };
}