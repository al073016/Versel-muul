"use client";

import { useState } from "react";
import type { POI } from "@/types/database";
import { getPremiumPhoto } from "@/lib/photo-engine";

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

  const finalPhotoUrl = poi.foto_url || getPremiumPhoto(poi.nombre, poi.categoria, poi.foto_url);

  return (
    <div className="absolute bottom-[180px] md:bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[420px] bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 z-50 animate-fade-in-up">
      {/* Photo Banner */}
      <div className="h-44 w-full relative overflow-hidden bg-slate-100">
        <img
          src={finalPhotoUrl}
          alt={poi.nombre}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/5 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-colors"
        >
          <span className="text-sm font-black">✕</span>
        </button>
      </div>

      <div className="p-8 -mt-10 relative z-10">
        <div className="flex gap-4 mb-6">
          <div className="w-16 h-16 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-4xl shrink-0 -mt-8 border border-slate-50">
            {poi.emoji || "📍"}
          </div>
          <div className="flex-1 overflow-hidden pt-2">
            <h4 className="font-headline font-black text-[#003e6f] text-2xl leading-tight truncate">
              {poi.nombre}
            </h4>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1">
              <span className={open ? "text-emerald-500" : "text-rose-500"}>● </span>
              {formatHorario(poi, t)}
            </p>
          </div>
        </div>

        {poi.descripcion && (
          <p className="text-xs text-neutral-500 leading-relaxed mb-6 font-medium line-clamp-3">
            {poi.descripcion}
          </p>
        )}

        <div className="flex gap-2 mb-8">
          <span className="text-[9px] bg-slate-100/80 text-[#003e6f] px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
            {poi.categoria}
          </span>
          {poi.precio_rango && (
            <span className="text-[9px] bg-slate-100/80 text-[#003e6f] px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
              {poi.precio_rango}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onToggleRoute(poi)}
            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isInRoute
                ? "bg-rose-50 text-rose-500 border border-rose-100"
                : "bg-[#003e6f] text-white !text-white shadow-xl shadow-[#003e6f]/20 hover:scale-105"
            }`}
          >
            {isInRoute ? `${t("quitarRuta")} (${routeIndex + 1})` : t("agregarRuta")}
          </button>
          <button
            onClick={() => onAskAI(poi)}
            className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#fed000] text-[#003e6f] flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-[#fed000]/20 hover:scale-105"
          >
            <span className="text-base font-emoji">✨</span>
            <span>{t("muulAi")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}