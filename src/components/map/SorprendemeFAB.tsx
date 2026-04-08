"use client";

interface SorprendemeFABProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Position override — default bottom-right above POI card area */
  className?: string;
}

export default function SorprendemeFAB({
  onClick,
  loading = false,
  disabled = false,
  className = "",
}: SorprendemeFABProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label="Sorpréndeme — ruta aleatoria"
      className={`
        group flex items-center gap-2 px-4 py-3 rounded-2xl
        bg-surface-bright/95 backdrop-blur-md
        border border-outline-variant/20
        shadow-2xl shadow-black/20
        text-on-surface font-headline font-black text-sm
        transition-all duration-200
        hover:scale-105 hover:shadow-secondary/20
        disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
        ${className}
      `}
    >
      {loading ? (
        <span className="material-symbols-outlined text-xl animate-spin text-secondary">
          progress_activity
        </span>
      ) : (
        <span
          className="material-symbols-outlined text-xl text-secondary group-hover:rotate-12 transition-transform duration-300"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          casino
        </span>
      )}
      <span className="text-xs uppercase tracking-widest">
        {loading ? "Generando…" : "Sorpréndeme"}
      </span>
    </button>
  );
}