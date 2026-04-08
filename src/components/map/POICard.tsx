"use client";

import { useState } from "react";
import type { POI } from "@/types/database";

/* ── Types ── */
interface POICardProps {
  poi: POI;
  isInRoute: boolean;
  routeIndex: number; // -1 if not in route
  onClose: () => void;
  onToggleRoute: (poi: POI) => void;
  onAskAI: (poi: POI) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

/* ── Helpers ── */
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

function formatHorario(poi: POI, t: (k: string, p?: any) => string): string {
  if (!poi.horario_apertura || !poi.horario_cierre) return t("horarioNoDisponible");
  return isOpenNow(poi)
    ? `${t("abierto")} · ${t("cierra", { hora: poi.horario_cierre })}`
    : `${t("cerrado")} · ${t("abre", { hora: poi.horario_apertura })}`;
}

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
export default function POICard({
  poi,
  isInRoute,
  routeIndex,
  onClose,
  onToggleRoute,
  onAskAI,
  t,
}: POICardProps) {
  const [imgError, setImgError] = useState(false);
  const open = isOpenNow(poi);

  // photo_url is expected on the POI type — cast to any if not yet typed
  const photoUrl = (poi as any).photo_url as string | undefined;

  return (
    <div className="absolute bottom-[180px] md:bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[360px] bg-surface-bright/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 z-50 animate-fade-in-up overflow-hidden">

      {/* ── Photo banner ── */}
      {photoUrl && !imgError ? (
        <div className="relative h-36 w-full bg-surface-container-high">
          <img
            src={photoUrl}
            alt={poi.nombre}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-bright/90 via-transparent to-transparent" />
          {/* Close button on top of photo */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-bright/80 backdrop-blur-sm text-on-surface hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                open
                  ? "bg-secondary/90 text-on-secondary"
                  : "bg-error/80 text-white"
              }`}
            >
              {open ? t("abierto") : t("cerrado")}
            </span>
          </div>
        </div>
      ) : (
        /* Fallback emoji banner */
        <div className="relative h-20 w-full bg-surface-container-high flex items-center justify-center">
          <span className="text-5xl">{poi.emoji || "📍"}</span>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Emoji badge (shown when photo is present) */}
          {photoUrl && !imgError && (
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl shadow-inner shrink-0">
              {poi.emoji || "📍"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-headline font-extrabold text-on-surface text-base leading-tight">
                {poi.nombre}
              </h4>
              {(poi as any).verificado && (
                <span className="text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5">
                  <span
                    className="material-symbols-outlined text-xs"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  Muul
                </span>
              )}
            </div>

            {/* Horario */}
            <p className="text-xs mt-0.5 flex items-center gap-1">
              <span className={open ? "text-secondary" : "text-tertiary"}>●</span>
              <span className="text-on-surface-variant">{formatHorario(poi, t)}</span>
            </p>

            {/* Tags row */}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              <span className="text-[9px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded font-black uppercase">
                {poi.categoria}
              </span>
              {(poi as any).precio_rango && (
                <span className="text-[9px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded font-black uppercase">
                  {(poi as any).precio_rango}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {poi.descripcion && (
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
            {poi.descripcion}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onToggleRoute(poi)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              isInRoute
                ? "bg-tertiary/20 text-tertiary border border-tertiary/30"
                : "bg-secondary text-on-secondary"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {isInRoute ? "remove_road" : "add_location_alt"}
            </span>
            {isInRoute
              ? `${t("quitarRuta")} (${routeIndex + 1})`
              : t("agregarRuta")}
          </button>

          <button
            onClick={() => onAskAI(poi)}
            className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-primary-container/30 text-primary border border-primary/20 flex items-center justify-center gap-1.5 hover:bg-primary-container/40 transition-all"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="hidden sm:inline">{t("muulAi")}</span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}