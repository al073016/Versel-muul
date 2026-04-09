"use client";

import { useTranslations } from "next-intl";
import type { TransportMode } from "@/hooks/useMapboxOptimization";

export type RouteMode = TransportMode | "accessible" | "metro";

/* ── Route color per mode ── */
export function getRouteColorForMode(mode: RouteMode): string {
  if (mode === "accessible") return "#003e6f"; // azul
  if (mode === "metro") return "#e11d8a"; // magenta metro
  if (mode === "walking") return "#22c55e"; // verde
  if (mode === "cycling" || mode === "driving") return "#fed000"; // amarillo
  return "#22c55e";
}

/* ── Props ── */
interface TransportSelectorProps {
  value: RouteMode;
  onChange: (mode: RouteMode) => void;
  enableMetro?: boolean;
  className?: string;
}

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
export default function TransportSelector({
  value,
  onChange,
  enableMetro = false,
  className = "",
}: TransportSelectorProps) {
  const t = useTranslations("mapa");

  /* ── Mode config ── */
  const OPTIONS: {
    value: TransportMode | "metro";
    label: string;
    icon: string;
  }[] = [
    { value: "walking", label: t("caminandoIcon"), icon: "directions_walk" },
    { value: "cycling", label: t("bicicleta"), icon: "directions_bike" },
    { value: "driving", label: t("vehiculoIcon"), icon: "directions_car" },
  ];

  if (enableMetro) {
    OPTIONS.push({ value: "metro", label: t("metroIcon"), icon: "subway" });
  }
  return (
    <div className={`flex gap-1.5 w-full ${className}`}>
      {OPTIONS.map((mode) => {
        const isActive = value === mode.value;

        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            title={mode.label}
            className={`
              flex-1 flex flex-col items-center justify-center gap-1.5
              py-3 px-1 rounded-xl text-[8px] font-black uppercase tracking-tighter
              border transition-all duration-200
              ${isActive
                ? "bg-secondary text-on-secondary border-secondary shadow-md shadow-secondary/20"
                : "bg-surface-container-highest text-on-surface-variant border-transparent hover:bg-surface-container-high"
              }
            `}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={isActive
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
              }
            >
              {mode.icon}
            </span>
            <span className="leading-tight text-center">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}