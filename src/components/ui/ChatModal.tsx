"use client";

import { useState, useEffect, useRef } from "react";
import type { POI } from "@/types/database";

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

export default function ChatModal({ isOpen, onClose, poi, idioma = "es-MX" }: ChatModalProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const preguntasEnviadas = mensajes.filter((m) => m.tipo === "pregunta").length;
  const limitAlcanzado = preguntasEnviadas >= MAX_PREGUNTAS_SESION;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  useEffect(() => {
    if (!poi || !isOpen) return;
    try {
      const saved = localStorage.getItem(`muul_chat_${poi.id}`);
      if (saved) {
        setMensajes(JSON.parse(saved));
      } else {
        setMensajes([]);
      }
    } catch {
      setMensajes([]);
    }
  }, [poi, isOpen]);

  useEffect(() => {
    if (!poi || mensajes.length === 0) return;
    try {
      localStorage.setItem(`muul_chat_${poi.id}`, JSON.stringify(mensajes));
    } catch {}
  }, [poi, mensajes]);

  const enviarPregunta = async () => {
    if (!input.trim() || !poi || cargando || limitAlcanzado) return;

    const nuevaMensaje: Mensaje = {
      tipo: "pregunta",
      contenido: input.trim(),
    };

    setMensajes((prev) => [...prev, nuevaMensaje]);
    setInput("");
    setCargando(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input.trim(),
          locale: idioma,
          context: poi,
          history: mensajes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const respuesta: Mensaje = {
          tipo: "respuesta",
          contenido: data.response || data.respuesta || "No pude generar una respuesta.",
        };
        setMensajes((prev) => [...prev, respuesta]);
      } else {
        const error: Mensaje = {
          tipo: "error",
          contenido: "Error al conectar con MUUL AI. Intenta de nuevo.",
        };
        setMensajes((prev) => [...prev, error]);
      }
    } catch (err) {
      console.error(err);
      const error: Mensaje = {
        tipo: "error",
        contenido: "Error de conexión. Por favor intenta de nuevo.",
      };
      setMensajes((prev) => [...prev, error]);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen || !poi) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-center p-4 md:p-6 bg-black/20 backdrop-blur-sm">
      <div className="w-full md:max-w-2xl h-[600px] md:h-[750px] bg-surface-container-lowest rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/40 relative">
        <header className="px-6 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-surface-container-low bg-white">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                smart_toy
              </span>
            </div>
            <div>
              <h2 className="font-headline italic text-xl md:text-3xl text-primary tracking-tight">🤖 Muul AI</h2>
              <span className="font-label text-xs uppercase tracking-widest text-tertiary-container font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
                Asistente Inteligente
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 bg-gradient-to-b from-surface-container-lowest to-surface-container-low"
        >
          {mensajes.length === 0 ? (
            <div className="flex flex-col gap-3 max-w-[80%]">
              <div className="bg-surface-container-low text-on-surface p-4 md:p-5 rounded-2xl rounded-tl-none shadow-sm">
                <p className="font-body text-sm md:text-base leading-relaxed">
                  Hola! Soy tu asistente inteligente de MUUL. Estoy aqui para ayudarte a conocer mejor {poi?.nombre || "este lugar"} y responder todas tus dudas. En que puedo ayudarte?
                </p>
              </div>
              <span className="font-label text-[10px] text-outline px-1">MUUL AI • AHORA</span>
            </div>
          ) : (
            mensajes.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-2 max-w-[85%] ${msg.tipo === "pregunta" ? "ml-auto items-end" : ""}`}>
                <div
                  className={`p-4 md:p-5 rounded-2xl shadow-sm ${
                    msg.tipo === "pregunta"
                      ? "bg-primary text-white rounded-tr-none"
                      : msg.tipo === "error"
                        ? "bg-error/20 text-error rounded-tl-none"
                        : "bg-surface-container-low text-on-surface rounded-tl-none border-l-4 border-secondary-container"
                  }`}
                >
                  <p className="font-body text-sm md:text-base leading-relaxed">{msg.contenido}</p>
                </div>
                <span className="font-label text-[10px] text-outline px-1">{msg.tipo === "pregunta" ? "TU" : "MUUL AI"} • AHORA</span>
              </div>
            ))
          )}

          {cargando && (
            <div className="flex flex-col gap-2 max-w-[80%]">
              <div className="bg-surface-container-low text-on-surface p-4 md:p-5 rounded-2xl rounded-tl-none animate-pulse">
                <p className="font-body text-sm md:text-base">Escribiendo...</p>
              </div>
            </div>
          )}
        </div>

        {mensajes.length === 0 && !cargando && (
          <div className="px-6 md:px-8 py-4 border-t border-surface-container-low bg-white">
            <p className="font-label text-xs text-outline mb-3 uppercase tracking-wider">Preguntas Sugeridas</p>
            <div className="flex flex-wrap gap-2">
              {["Cuales son los horarios?", "Que categoria tiene?", "Hay estacionamiento?"].map((sugerencia, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(sugerencia)}
                  className="px-3 md:px-4 py-2 rounded-full border-2 border-primary/20 text-primary text-xs md:text-sm font-label hover:bg-primary hover:text-white transition-all duration-300"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          </div>
        )}

        <footer className="p-4 md:p-6 bg-white border-t border-surface-container-low">
          {limitAlcanzado ? (
            <div className="text-center p-3 bg-error/10 rounded-xl text-error font-body text-sm">
              Alcanzaste el limite de {MAX_PREGUNTAS_SESION} preguntas en esta sesion.
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute inset-0 bg-secondary-container/10 rounded-2xl blur-xl group-focus-within:blur-2xl transition-all opacity-0 group-focus-within:opacity-100 -z-10"></div>
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-2xl p-2 shadow-inner border border-outline-variant/20 focus-within:border-primary/40 transition-all">
                <button className="p-3 text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviarPregunta();
                    }
                  }}
                  placeholder="Escribe tu pregunta aqui..."
                  disabled={cargando}
                  className="flex-1 bg-transparent border-none focus:ring-0 font-body text-on-surface px-2 md:px-4 placeholder:text-outline/60 disabled:opacity-50 text-sm md:text-base"
                />
                <button
                  onClick={enviarPregunta}
                  disabled={cargando || !input.trim()}
                  className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    send
                  </span>
                </button>
              </div>
            </div>
          )}
          <div className="mt-3 flex justify-center">
            <p className="font-label text-[10px] text-outline/60 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">security</span>
              Tu informacion esta protegida por MUUL.
            </p>
          </div>
          <p className="font-label text-[9px] text-outline/50 text-center mt-2">
            {preguntasEnviadas}/{MAX_PREGUNTAS_SESION} preguntas • Powered by Muul AI
          </p>
        </footer>
      </div>
    </div>
  );
}
