"use client";

import { useState, useEffect, useRef } from "react";
import type { POI } from "@/types/database";
import { getPreguntasParaPOI, getIdiomaKey } from "@/lib/preguntasChatbot";
import { useTranslations } from "next-intl";

interface Mensaje {
  tipo: "pregunta" | "respuesta" | "error";
  contenido: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  poi: POI | null;
  idioma?: string;
}

const MAX_PREGUNTAS_SESION = 15;
const COOLDOWN_MS = 2000;

export default function ChatModal({ isOpen, onClose, poi, idioma = "es-MX" }: ChatModalProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [ultimaPregunta, setUltimaPregunta] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevPoiId = useRef<string | null>(null);
  const t = useTranslations("chatbot");

  const idiomaKey = getIdiomaKey(idioma);
  const preguntas = poi ? getPreguntasParaPOI(poi.categoria) : [];
  const preguntasEnviadas = mensajes.filter((m) => m.tipo === "pregunta").length;
  const limitAlcanzado = preguntasEnviadas >= MAX_PREGUNTAS_SESION;

  useEffect(() => {
    if (!poi || !isOpen) return;
    if (prevPoiId.current !== poi.id) {
      prevPoiId.current = poi.id;
      try {
        const saved = localStorage.getItem(`muul_chat_${poi.id}`);
        if (saved) { setMensajes(JSON.parse(saved)); } else { setMensajes([]); }
      } catch { setMensajes([]); }
    }
  }, [poi, isOpen]);

  useEffect(() => {
    if (!poi || mensajes.length === 0) return;
    try { localStorage.setItem(`muul_chat_${poi.id}`, JSON.stringify(mensajes)); } catch {}
  }, [mensajes, poi]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes, cargando]);

  const enviarPregunta = async (texto: string) => {
    if (!poi || cargando || limitAlcanzado) return;
    const ahora = Date.now();
    if (ahora - ultimaPregunta < COOLDOWN_MS) return;
    setUltimaPregunta(ahora);

    const nuevosMensajes: Mensaje[] = [...mensajes, { tipo: "pregunta", contenido: texto }];
    setMensajes(nuevosMensajes);
    setCargando(true);

    try {
      const historial = nuevosMensajes
        .filter((m) => m.tipo !== "error")
        .slice(-10)
        .map((m) => ({ tipo: m.tipo as "pregunta" | "respuesta", contenido: m.contenido }));
      historial.pop();

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregunta: texto,
          poi: { nombre: poi.nombre, categoria: poi.categoria, descripcion: poi.descripcion, horario_apertura: poi.horario_apertura, horario_cierre: poi.horario_cierre, precio_rango: poi.precio_rango, emoji: poi.emoji, verificado: poi.verificado, direccion: poi.direccion },
          idioma,
          historial,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensajes((prev) => [...prev, { tipo: "error", contenido: data.error || t("genericError") }]);
      } else {
        setMensajes((prev) => [...prev, { tipo: "respuesta", contenido: data.respuesta }]);
      }
    } catch {
      setMensajes((prev) => [...prev, { tipo: "error", contenido: t("connectionError") }]);
    }
    setCargando(false);
  };

  const limpiarHistorial = () => {
    setMensajes([]);
    if (poi) { try { localStorage.removeItem(`muul_chat_${poi.id}`); } catch {} }
  };

  if (!isOpen || !poi) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85svh] sm:h-[720px] sm:max-h-[90vh] border border-outline-variant/10 animate-fade-in-up">        {/* Header */}
        <div className="p-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black font-headline text-on-surface leading-tight flex items-center gap-1.5">🤖 {t("titulo")}</h2>
              <p className="text-[11px] text-on-surface-variant font-medium truncate">{poi.emoji} {poi.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mensajes.length > 0 && (
              <button onClick={limpiarHistorial} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">delete_sweep</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: "none" }}>
          {mensajes.length === 0 && (
            <div className="flex items-end gap-3 max-w-[85%]">
              <div className="p-4 rounded-2xl rounded-bl-none bg-[#1C1C1E] text-on-surface text-sm leading-relaxed border border-outline-variant/5">
                {t("bienvenida", { nombre: poi.nombre })}
              </div>
            </div>
          )}

          {mensajes.map((msg, i) => (
            <div key={i} className={`flex items-end gap-3 ${msg.tipo === "pregunta" ? "justify-end" : ""} max-w-[85%] ${msg.tipo === "pregunta" ? "ml-auto" : ""}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.tipo === "pregunta" ? "rounded-br-none bg-primary text-on-primary font-medium shadow-lg"
                : msg.tipo === "error" ? "rounded-bl-none bg-error-container/20 text-error border border-error/20"
                : "rounded-bl-none bg-[#1C1C1E] text-on-surface border border-outline-variant/5"
              }`}>{msg.contenido}</div>
            </div>
          ))}

          {cargando && (
            <div className="flex items-end gap-3 max-w-[85%]">
              <div className="p-4 rounded-2xl rounded-bl-none bg-[#1C1C1E] border border-outline-variant/5 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="p-5 bg-surface-container-low border-t border-outline-variant/10 space-y-4">
          {limitAlcanzado && (
            <div className="p-3 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary text-xs font-medium text-center">
              {t("limiteAlcanzado", { max: MAX_PREGUNTAS_SESION })}
            </div>
          )}

          {!limitAlcanzado && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {preguntas.map((p) => (
                <button key={p.id} onClick={() => enviarPregunta(p[idiomaKey] as string)} disabled={cargando}
                  className="whitespace-nowrap px-4 py-2 rounded-full border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                  {p[idiomaKey] as string}
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] text-on-surface-variant text-center">
            {preguntasEnviadas}/{MAX_PREGUNTAS_SESION} {t("preguntas")} · {t("powered")}
          </p>
        </div>
      </div>
    </div>
  );
}