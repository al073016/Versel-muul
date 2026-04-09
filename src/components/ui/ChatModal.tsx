"use client";

import { useState, useEffect, useRef } from "react";
import type { POI } from "@/types/database";
import { useTranslations } from "next-intl";
import {
  getPreguntasParaPOI,
  getPreguntasPorContexto,
  getTextoPregunta,
  getTextoPreguntaPorId,
  type PreguntaPredefinida,
} from "@/lib/preguntasChatbot";

interface Mensaje {
  tipo: "pregunta" | "respuesta" | "error";
  contenido: string;
  preguntaId?: string;
  idiomaMensaje?: string;
  errorKey?: "apiKeyOff" | "connectionError" | "genericErrorMessage";
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  poi: POI | null;
  poisEnRuta?: POI[];
  totalVisibles?: number;
  idioma?: string;
}

const MAX_PREGUNTAS_SESION = 15;
const COOLDOWN_MS = 1800;

export default function ChatModal({ isOpen, onClose, poi, poisEnRuta = [], totalVisibles = 0, idioma = "es-MX" }: ChatModalProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [ultimaPregunta, setUltimaPregunta] = useState(0);
  const [preguntasConsumidas, setPreguntasConsumidas] = useState(0);
  const [apiDisponible, setApiDisponible] = useState(true);
  const [estadoServicio, setEstadoServicio] = useState<"ok" | "retrying" | "error">("ok");
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("chatbot");

  const limitAlcanzado = preguntasConsumidas >= MAX_PREGUNTAS_SESION;

  const contextoChat: "general" | "poi" | "negocio" | "ruta" =
    poisEnRuta.length >= 2 ? "ruta" : poi?.negocio_id ? "negocio" : poi ? "poi" : "general";

  const preguntasSugeridas: PreguntaPredefinida[] = (() => {
    if (contextoChat === "poi" && poi) {
      return getPreguntasParaPOI(poi.categoria);
    }
    if (contextoChat === "negocio") {
      return getPreguntasPorContexto("negocio");
    }
    if (contextoChat === "ruta") {
      return getPreguntasPorContexto("ruta");
    }
    return getPreguntasPorContexto("general");
  })();

  const conversationKey = poi?.id || `contexto_${contextoChat}`;
  const counterKey = `muul_chat_count_${conversationKey}`;
  const historyKey = `muul_chat_${conversationKey}`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  useEffect(() => {
    if (!isOpen) return;
    try {
        const saved = localStorage.getItem(historyKey);
        const savedCount = localStorage.getItem(counterKey);
      if (saved) {
        setMensajes(JSON.parse(saved));
      } else {
        setMensajes([]);
      }
        setPreguntasConsumidas(savedCount ? Number(savedCount) || 0 : 0);
    } catch {
      setMensajes([]);
        setPreguntasConsumidas(0);
    }
    }, [historyKey, counterKey, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;

    const revisarDisponibilidad = async () => {
      try {
        const res = await fetch("/api/chatbot", { method: "GET" });
        const data = await res.json();
        if (!isActive) return;
        setApiDisponible(Boolean(data?.available));
          setEstadoServicio(data?.available ? "ok" : "error");
      } catch {
          if (isActive) {
            setApiDisponible(false);
            setEstadoServicio("error");
          }
      }
    };

    revisarDisponibilidad();
    return () => {
      isActive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!apiDisponible) return;

    const pendientes = mensajes
      .map((m, index) => ({ m, index }))
      .filter(({ m }) => (m.tipo === "respuesta" || (m.tipo === "pregunta" && !m.preguntaId)) && m.idiomaMensaje !== idioma)
      .filter(({ m }) => !m.errorKey);

    if (pendientes.length === 0) return;

    let cancelado = false;

    const traducir = async () => {
      try {
        const texts = pendientes.map(({ m }) => m.contenido);
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            translationBatch: {
              texts,
              targetLocale: idioma,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok || !Array.isArray(data?.translations) || cancelado) return;

        setMensajes((prev) => {
          const next = [...prev];
          pendientes.forEach(({ index }, i) => {
            if (!next[index]) return;
            next[index] = {
              ...next[index],
              contenido: typeof data.translations[i] === "string" ? data.translations[i] : next[index].contenido,
              idiomaMensaje: idioma,
            };
          });
          return next;
        });
      } catch {
        // Ignore silent translation errors; we keep existing history text.
      }
    };

    traducir();

    return () => {
      cancelado = true;
    };
  }, [idioma, isOpen, apiDisponible, mensajes]);

  useEffect(() => {
      try {
        if (mensajes.length === 0) {
          localStorage.removeItem(historyKey);
        } else {
          localStorage.setItem(historyKey, JSON.stringify(mensajes));
        }
      } catch {}
    }, [historyKey, mensajes]);

  useEffect(() => {
    try {
      localStorage.setItem(counterKey, String(preguntasConsumidas));
    } catch {}
  }, [counterKey, preguntasConsumidas]);

  const enviarPregunta = async (pregunta: PreguntaPredefinida) => {
    const question = getTextoPregunta(pregunta, idioma).trim();
    if (!question || cargando || limitAlcanzado || !apiDisponible) return;
    const ahora = Date.now();
    if (ahora - ultimaPregunta < COOLDOWN_MS) return;
    setUltimaPregunta(ahora);

    const nuevaMensaje: Mensaje = {
      tipo: "pregunta",
      contenido: question,
      preguntaId: pregunta.id,
      idiomaMensaje: idioma,
    };

    setMensajes((prev) => [...prev, nuevaMensaje]);
      setPreguntasConsumidas((prev) => prev + 1);
    setCargando(true);
      setEstadoServicio("ok");

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question,
          locale: idioma,
          context: {
            tipo_contexto: contextoChat,
            poi,
            ruta: poisEnRuta,
            total_visibles: totalVisibles,
          },
          history: [...mensajes, nuevaMensaje],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const respuesta: Mensaje = {
          tipo: "respuesta",
          contenido: data.response || data.respuesta || t("noResponse"),
            idiomaMensaje: idioma,
        };
        setMensajes((prev) => [...prev, respuesta]);
          setEstadoServicio("ok");
      } else {
        if (data?.code === "OPENROUTER_KEY_OFF") {
          setApiDisponible(false);
            setEstadoServicio("error");
        }
          if (data?.code === "RATE_LIMITED") {
            setEstadoServicio("retrying");
          }
        const error: Mensaje = {
          tipo: "error",
            contenido: "",
            errorKey: data?.code === "OPENROUTER_KEY_OFF" ? "apiKeyOff" : "genericErrorMessage",
            idiomaMensaje: idioma,
        };
        setMensajes((prev) => [...prev, error]);
      }
    } catch (err) {
      console.error(err);
        setEstadoServicio("error");
      const error: Mensaje = {
        tipo: "error",
          contenido: "",
          errorKey: "connectionError",
          idiomaMensaje: idioma,
      };
      setMensajes((prev) => [...prev, error]);
    } finally {
      setCargando(false);
    }
  };

  const textoMensaje = (msg: Mensaje): string => {
    if (msg.errorKey) return t(msg.errorKey);
    if (msg.tipo === "pregunta" && msg.preguntaId) {
      return getTextoPreguntaPorId(msg.preguntaId, idioma) || msg.contenido;
    }
    return msg.contenido;
  };

  const resetProvisional = () => {
    setMensajes([]);
    setUltimaPregunta(0);
    setPreguntasConsumidas(0);
    try {
      localStorage.removeItem(historyKey);
      localStorage.removeItem(counterKey);
    } catch {}
  };

  const limpiarSoloHistorial = () => {
    setMensajes([]);
    try {
      localStorage.removeItem(historyKey);
    } catch {}
  };

  const subtitle =
    contextoChat === "ruta"
      ? t("contextRoute", { count: poisEnRuta.length })
      : contextoChat === "negocio"
        ? t("contextBusiness")
        : contextoChat === "poi"
          ? t("contextPlace")
          : t("contextGeneral");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-center p-0 md:p-6 bg-[#0b2740]/20 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full md:max-w-2xl h-[86svh] md:h-[760px] bg-[#f4f6f8] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/60">
        <header className="px-6 md:px-8 py-5 flex items-center justify-between border-b border-[#dce2e8] bg-[#f4f6f8]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-11 h-11 rounded-full bg-[#003e6f] flex items-center justify-center text-white border border-white/20 shadow-sm">
              <span className="text-sm tracking-wide" aria-hidden="true">✦</span>
            </div>
            <div>
              <h2 className="font-headline italic text-[2rem] text-[#003e6f] tracking-tight leading-none">Muul AI</h2>
              <span className="font-body normal-case text-[12px] text-[#005596] font-semibold flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7abf9e] animate-pulse"></span>
                {subtitle}
              </span>
            </div>
          </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={limpiarSoloHistorial}
                className="p-2 hover:bg-[#e8edf2] rounded-full transition-colors text-[#4e5d6a]"
                title={t("clearHistory")}
                aria-label={t("clearHistory")}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#e8edf2] rounded-full transition-colors text-[#4e5d6a]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 bg-[#eef2f6]"
        >
          {mensajes.length === 0 ? (
            <div className="flex flex-col gap-3 max-w-[80%]">
              <div className="bg-white text-[#243645] p-4 md:p-5 rounded-2xl rounded-tl-none shadow-sm border border-[#dce2e8]">
                <p className="font-body text-sm md:text-base leading-relaxed">
                  {t("welcomeBase", { nombre: poi?.nombre || t("mapName") })}
                  {contextoChat === "general"
                    ? ` ${t("welcomeGeneral")}`
                    : ` ${t("welcomeContext")}`}
                </p>
              </div>
              <span className="font-body normal-case text-[11px] text-[#667788] px-1">Muul AI • {t("now")}</span>
            </div>
          ) : (
            mensajes.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-2 max-w-[85%] ${msg.tipo === "pregunta" ? "ml-auto items-end" : ""}`}>
                <div
                  className={`p-4 md:p-5 rounded-2xl shadow-sm ${
                    msg.tipo === "pregunta"
                      ? "bg-[#003e6f] text-white rounded-tr-none"
                      : msg.tipo === "error"
                        ? "bg-[#f9dfe0] text-[#be2d2d] rounded-tl-none"
                        : "bg-white text-[#243645] rounded-tl-none border-l-4 border-[#9ec1d9]"
                  }`}
                >
                    <p className="font-body normal-case text-sm md:text-base leading-relaxed">{textoMensaje(msg)}</p>
                </div>
                  <span className="font-body normal-case text-[11px] text-[#667788] px-1">{msg.tipo === "pregunta" ? t("you") : "Muul AI"} • {t("now")}</span>
              </div>
            ))
          )}

          {cargando && (
            <div className="flex flex-col gap-2 max-w-[80%]">
              <div className="bg-white text-[#243645] p-4 md:p-5 rounded-2xl rounded-tl-none border border-[#dce2e8]">
                <div className="flex items-center gap-1.5 h-6">
                  <span className="w-2 h-2 rounded-full bg-[#9fb7cd] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#9fb7cd] animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#9fb7cd] animate-bounce" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 md:p-6 bg-[#f4f6f8] border-t border-[#dce2e8]">
            {estadoServicio === "retrying" && (
              <div className="mb-3 rounded-xl border border-[#f0d9a6] bg-[#fff5df] text-[#8c6226] px-3 py-2 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">sync</span>
                {t("serviceRetrying")}
              </div>
            )}

          {!apiDisponible && (
            <div className="mb-3 text-center p-3 bg-[#f9dfe0] rounded-xl text-[#be2d2d] font-body text-sm">
              {t("apiKeyOff")}
            </div>
          )}

          {limitAlcanzado ? (
            <div className="text-center p-3 bg-[#f9dfe0] rounded-xl text-[#be2d2d] font-body text-sm">
              {t("limiteAlcanzado", { max: MAX_PREGUNTAS_SESION })}
            </div>
          ) : (
            <div className="space-y-3">
                <p className="font-body normal-case text-sm text-[#4e5d6a] font-medium">
                {t("suggestedQuestions")}
              </p>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {preguntasSugeridas.map((sugerencia, idx) => (
                  <button
                      key={sugerencia.id}
                      onClick={() => enviarPregunta(sugerencia)}
                    disabled={cargando || !apiDisponible}
                      className="px-4 py-2 rounded-full border border-[#b7c7d6] text-[#0c4f86] text-sm font-body normal-case font-medium hover:bg-[#0c4f86] hover:text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                      {getTextoPregunta(sugerencia, idioma)}
                  </button>
                ))}
              </div>
            </div>
          )}
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={resetProvisional}
                className="px-3 py-1.5 rounded-md border border-[#c8d3df] text-[#4e5d6a] text-xs font-body normal-case hover:bg-[#e8edf2] transition-colors"
              >
                {t("testReset")}
              </button>
            </div>
          <div className="mt-3 flex justify-center">
            <p className="font-body normal-case text-[12px] text-[#0c4f86] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              {t("security")}
            </p>
          </div>
          <p className="font-body normal-case text-[12px] text-[#0c4f86] text-center mt-2">
            {preguntasConsumidas}/{MAX_PREGUNTAS_SESION} {t("preguntas")} • {t("powered")}
          </p>
        </footer>
      </div>
    </div>
  );
}
