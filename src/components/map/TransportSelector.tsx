"use client";

import type { TransportMode } from "@/hooks/useMapboxOptimization";

/* ── Route color per mode ── */
export function getRouteColorForMode(mode: TransportMode | "accessible"): string {
  switch (mode) {
    case "walking":    return "#98d5a2"; // soft green
    case "cycling":    return "#b0c6fd"; // soft blue
    case "driving":    return "#ffb3b3"; // soft red
    case "accessible": return "#fed000"; // MUUL yellow — high visibility
    default:           return "#98d5a2";
  }
}

/* ── Props ── */
interface TransportSelectorProps {
  value: TransportMode | "accessible";
  onChange: (mode: TransportMode | "accessible") => void;
}

/* ── Mode config ── */
const MODES: {
  value: TransportMode | "accessible";
  icon: string;
  label: string;
  title: string;
}[] = [
  {
    value: "walking",
    icon: "directions_walk",
    label: "Caminando",
    title: "Ruta a pie",
  },
  {
    value: "cycling",
    icon: "directions_bike",
    label: "Bicicleta",
    title: "Ruta en bicicleta",
  },
  {
    value: "driving",
    icon: "directions_car",
    label: "Vehículo",
    title: "Ruta en auto",
  },
  {
    value: "accessible",
    icon: "accessible",
    label: "Accesible",
    title: "Ruta accesible — optimizada para silla de ruedas y movilidad reducida",
  },
];

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
export default function TransportSelector({ value, onChange }: TransportSelectorProps) {
  return (
    <div className="flex gap-1.5 w-full">
      {MODES.map((mode) => {
        const isActive = value === mode.value;
        const isAccessible = mode.value === "accessible";

        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            title={mode.title}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5
              py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
              border transition-all duration-200
              ${isActive
                ? isAccessible
                  ? "bg-[#fed000] text-[#003e6f] border-[#fed000] shadow-lg shadow-[#fed000]/30"
                  : "bg-secondary text-on-secondary border-secondary shadow-md shadow-secondary/20"
                : "bg-surface-container-highest text-on-surface-variant border-transparent hover:bg-surface-container-high"
              }
            `}
          >
            <span
              className="material-symbols-outlined text-base"
              style={isActive && isAccessible
                ? { fontVariationSettings: "'FILL' 1" }
                : isActive
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
              }
            >
              {mode.icon}
            </span>
            <span className="leading-none">{mode.label}</span>

            {/* Accessibility badge */}
            {isAccessible && isActive && (
              <span className="text-[7px] font-black bg-[#003e6f] text-white px-1 py-0.5 rounded-full leading-none mt-0.5">
                ♿ OSM
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}