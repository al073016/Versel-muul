"use client";

import type { TransportMode } from "@/hooks/useMapboxOptimization";

interface TransportSelectorProps {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
  className?: string;
}

const MODES: {
  value: TransportMode;
  icon: string;
  label: string;
  color: string;
  activeStyle: string;
}[] = [
  {
    value: "walking",
    icon: "directions_walk",
    label: "Caminando",
    color: "#98d5a2",
    activeStyle: "bg-[#98d5a2]/20 text-[#98d5a2] border border-[#98d5a2]/40",
  },
  {
    value: "cycling",
    icon: "directions_bike",
    label: "Bicicleta",
    color: "#facc15",
    activeStyle: "bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/40",
  },
  {
    value: "driving",
    icon: "directions_car",
    label: "Vehículo",
    color: "#b0c6fd",
    activeStyle: "bg-[#b0c6fd]/20 text-[#b0c6fd] border border-[#b0c6fd]/40",
  },
];

export default function TransportSelector({
  value,
  onChange,
  className = "",
}: TransportSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {MODES.map((mode) => {
        const isActive = value === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              isActive
                ? mode.activeStyle
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}
            aria-pressed={isActive}
            title={mode.label}
          >
            <span className="material-symbols-outlined text-sm">{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Export the color for each mode so the map can use it */
export function getRouteColorForMode(mode: TransportMode): string {
  return MODES.find((m) => m.value === mode)?.color ?? "#98d5a2";
}