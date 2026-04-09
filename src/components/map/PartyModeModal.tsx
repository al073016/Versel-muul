"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { POI } from "@/types/database";
import { usePartyMode, type PartyRoute } from "@/hooks/usePartyMode";

/* ── Types ── */
interface PartyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, shows "activate party mode" for this already-saved route */
  savedRouteId?: string;
  /** POIs in current unsaved route — to create a new party route */
  poisEnRuta?: POI[];
  distanciaTexto?: string;
  duracionTexto?: string;
  /** Called when user joins a public route and wants to load its POIs */
  onLoadRoute?: (pois: { id: string; nombre: string; emoji: string; categoria: string }[]) => void;
}

/* ── Copy to clipboard util ── */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Tab = "mi_ruta" | "unirse" | "explorar";

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
export default function PartyModeModal({
  isOpen,
  onClose,
  savedRouteId,
  poisEnRuta = [],
  distanciaTexto = "",
  duracionTexto = "",
  onLoadRoute,
}: PartyModeModalProps) {
  const tp = useTranslations("partyMode");
  const {
    loading,
    error,
    successMsg,
    publicRoutes,
    participants,
    activatePartyMode,
    saveAsPartyRoute,
    joinPartyRoute,
    fetchParticipants,
    fetchPublicRoutes,
    clearMessages,
  } = usePartyMode();

  const [tab, setTab] = useState<Tab>("mi_ruta");
  const [activeRouteId, setActiveRouteId] = useState<string | null>(savedRouteId ?? null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    clearMessages();
    setTab("mi_ruta");
    setJoinCode("");
    setCopied(false);
    if (activeRouteId) fetchParticipants(activeRouteId);
  }, [isOpen]);

  useEffect(() => {
    if (tab === "explorar") fetchPublicRoutes();
  }, [tab]);

  if (!isOpen) return null;

  const partyLink = activeRouteId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/mapa?party=${activeRouteId}`
    : null;

  const handleActivate = async () => {
    if (savedRouteId) {
      const ok = await activatePartyMode(savedRouteId);
      if (ok) setActiveRouteId(savedRouteId);
    } else {
      const id = await saveAsPartyRoute(poisEnRuta, distanciaTexto, duracionTexto);
      if (id) {
        setActiveRouteId(id);
        await fetchParticipants(id);
      }
    }
  };

  const handleJoin = async () => {
    const id = joinCode.trim();
    if (!id) return;
    const ruta = await joinPartyRoute(id);
    if (ruta?.pois_data && onLoadRoute) {
      onLoadRoute(ruta.pois_data);
      onClose();
    }
  };

  const handleCopyLink = async () => {
    if (!partyLink) return;
    const ok = await copyToClipboard(partyLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareNative = async () => {
    if (!partyLink) return;
    if (navigator.share) {
      await navigator.share({ title: tp("shareTitle"), url: partyLink });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/10 animate-fade-in-up">

        {/* Header */}
        <div className="p-5 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-headline font-black text-on-surface text-base flex items-center gap-2">
              <span className="text-xl">🎉</span> {tp("title")}
            </h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {tp("subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-variant rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/10 shrink-0">
          {(["mi_ruta", "unirse", "explorar"] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                tab === tabKey
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tabKey === "mi_ruta" && tp("tabs.myRoute")}
              {tabKey === "unirse" && tp("tabs.join")}
              {tabKey === "explorar" && tp("tabs.explore")}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

          {/* ── MI RUTA TAB ── */}
          {tab === "mi_ruta" && (
            <div className="p-5 space-y-4">
              {!activeRouteId ? (
                <>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {tp("activateDescription")}
                  </p>
                  {poisEnRuta.length > 0 && (
                    <div className="p-3 rounded-xl bg-surface-container-high space-y-2">
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                        {tp("currentRoute")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {poisEnRuta.map((p) => (
                          <span key={p.id} className="text-sm" title={p.nombre}>
                            {p.emoji}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-on-surface-variant">
                        {distanciaTexto} · {duracionTexto}
                      </p>
                    </div>
                  )}
                  {error && (
                    <p className="text-xs text-error font-medium">{error}</p>
                  )}
                  <button
                    onClick={handleActivate}
                    disabled={loading || (poisEnRuta.length < 2 && !savedRouteId)}
                    className="w-full bg-secondary text-on-secondary py-3.5 rounded-xl font-headline font-black text-sm uppercase tracking-widest disabled:opacity-40 transition-all hover:brightness-110"
                  >
                    {loading ? tp("activating") : `🎉 ${tp("activateButton")}`}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  {successMsg && (
                    <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                      <p className="text-sm text-secondary font-bold text-center">{successMsg}</p>
                    </div>
                  )}

                  {/* QR-style code display */}
                  <div className="p-4 rounded-2xl bg-surface-container-high space-y-2 text-center">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      {tp("routeCode")}
                    </p>
                    <p className="font-mono text-xs text-on-surface break-all select-all bg-surface-container-highest p-2 rounded-lg">
                      {activeRouteId}
                    </p>
                  </div>

                  {/* Share actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copied ? "check" : "content_copy"}
                      </span>
                      {copied ? tp("copied") : tp("copyLink")}
                    </button>
                    <button
                      onClick={handleShareNative}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                      {tp("share")}
                    </button>
                  </div>

                  {/* Participants */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      {tp("participants", { count: participants.length })}
                    </p>
                    {participants.length === 0 ? (
                      <p className="text-xs text-on-surface-variant text-center py-3">
                        {tp("noParticipants")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {participants.map((p, i) => (
                          <div
                            key={p.usuario_id}
                            className="w-9 h-9 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center text-xs font-black text-secondary"
                            title={tp("participantTitle", { number: i + 1 })}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── UNIRSE TAB ── */}
          {tab === "unirse" && (
            <div className="p-5 space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {tp("joinDescription")}
              </p>
              <textarea
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder={tp("joinPlaceholder")}
                rows={3}
                className="w-full bg-surface-container-high border-none rounded-xl p-3 text-on-surface text-xs placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40 resize-none font-mono"
              />
              {error && <p className="text-xs text-error font-medium">{error}</p>}
              {successMsg && <p className="text-xs text-secondary font-bold">{successMsg}</p>}
              <button
                onClick={handleJoin}
                disabled={loading || joinCode.trim().length < 8}
                className="w-full bg-secondary text-on-secondary py-3.5 rounded-xl font-headline font-black text-sm uppercase tracking-widest disabled:opacity-40 transition-all hover:brightness-110"
              >
                {loading ? tp("joining") : tp("joinRoute")}
              </button>
            </div>
          )}

          {/* ── EXPLORAR TAB ── */}
          {tab === "explorar" && (
            <div className="p-5 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 rounded-xl bg-surface-container-high">
                      <div className="h-3 bg-surface-container-highest rounded w-3/4 mb-2" />
                      <div className="h-2 bg-surface-container-highest rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : publicRoutes.length === 0 ? (
                <div className="flex flex-col items-center text-center py-10 space-y-3">
                  <span className="text-4xl">🗺️</span>
                  <p className="text-on-surface-variant text-sm">
                    {tp("noPublicRoutes")}
                  </p>
                </div>
              ) : (
                publicRoutes.map((ruta) => (
                  <div
                    key={ruta.id}
                    className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-3"
                  >
                    <div>
                      <div className="flex gap-1 mb-1">
                        {ruta.pois_data?.map((p, i) => (
                          <span key={i} className="text-lg">{p.emoji}</span>
                        ))}
                      </div>
                      <p className="text-xs font-bold text-on-surface truncate">{ruta.nombre}</p>
                      {ruta.distancia_texto && (
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {ruta.distancia_texto} · {ruta.duracion_texto}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (onLoadRoute) onLoadRoute(ruta.pois_data);
                        onClose();
                      }}
                      className="w-full bg-secondary/20 text-secondary border border-secondary/30 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-secondary/30 transition-all"
                    >
                      {tp("copyThisRoute")}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}