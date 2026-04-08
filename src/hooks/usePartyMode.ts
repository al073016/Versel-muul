"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { POI } from "@/types/database";

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

/* ══════════════════════════════════════════════
   HOOK
   ══════════════════════════════════════════════ */
export function usePartyMode() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [publicRoutes, setPublicRoutes] = useState<PartyRoute[]>([]);
  const [participants, setParticipants] = useState<PartyParticipant[]>([]);

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  /* ── Activate Party Mode on an existing saved route ── */
  const activatePartyMode = useCallback(
    async (rutaId: string): Promise<boolean> => {
      clearMessages();
      setLoading(true);
      const { error: err } = await supabase
        .from("rutas_guardadas")
        .update({ es_publica: true })
        .eq("id", rutaId);
      setLoading(false);
      if (err) {
        setError("No se pudo activar el modo Party");
        return false;
      }
      setSuccessMsg("¡Ruta pública! Comparte el código con tus amigos 🎉");
      return true;
    },
    [supabase]
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
        setError("Error al desactivar modo Party");
        return false;
      }
      return true;
    },
    [supabase]
  );

  /* ── Save a new route directly as public ── */
  const saveAsPartyRoute = useCallback(
    async (
      poisEnRuta: POI[],
      distancia_texto: string,
      duracion_texto: string
    ): Promise<string | null> => {
      clearMessages();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Debes iniciar sesión para crear una ruta Party");
        return null;
      }
      setLoading(true);
      const nombre = poisEnRuta.map((p) => p.nombre).join(" → ");
      const { data, error: err } = await supabase
        .from("rutas_guardadas")
        .insert({
          usuario_id: user.id,
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
        })
        .select("id")
        .single();
      setLoading(false);
      if (err || !data) {
        setError("Error al crear la ruta Party");
        return null;
      }
      // Add creator as first participant
      await supabase
        .from("rutas_participantes")
        .insert({ ruta_id: data.id, usuario_id: user.id });
      setSuccessMsg("¡Ruta Party creada! 🎉");
      return data.id;
    },
    [supabase]
  );

  /* ── Join an existing public route by its ID ── */
  const joinPartyRoute = useCallback(
    async (rutaId: string): Promise<PartyRoute | null> => {
      clearMessages();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Debes iniciar sesión para unirte a una ruta");
        return null;
      }
      setLoading(true);

      // Fetch the route
      const { data: ruta, error: fetchErr } = await supabase
        .from("rutas_guardadas")
        .select("*")
        .eq("id", rutaId)
        .eq("es_publica", true)
        .single();

      if (fetchErr || !ruta) {
        setError("Ruta no encontrada o no es pública");
        setLoading(false);
        return null;
      }

      // Check if already joined
      const { data: existing } = await supabase
        .from("rutas_participantes")
        .select("usuario_id")
        .eq("ruta_id", rutaId)
        .eq("usuario_id", user.id)
        .single();

      if (!existing) {
        await supabase
          .from("rutas_participantes")
          .insert({ ruta_id: rutaId, usuario_id: user.id });
      }

      setLoading(false);
      setSuccessMsg("¡Te uniste a la ruta! 🎊");
      return ruta as PartyRoute;
    },
    [supabase]
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
    const { data } = await supabase
      .from("rutas_guardadas")
      .select("*")
      .eq("es_publica", true)
      .order("created_at", { ascending: false })
      .limit(20);
    setPublicRoutes((data as PartyRoute[]) ?? []);
    setLoading(false);
  }, [supabase]);

  return {
    loading,
    error,
    successMsg,
    publicRoutes,
    participants,
    activatePartyMode,
    deactivatePartyMode,
    saveAsPartyRoute,
    joinPartyRoute,
    fetchParticipants,
    fetchPublicRoutes,
    clearMessages,
  };
}