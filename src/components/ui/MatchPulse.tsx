"use client";

import { useTranslations } from "next-intl";

interface MatchPulseProps {
  matchText?: string;
  show?: boolean;
}

export default function MatchPulse({
  matchText,
  show = true,
}: MatchPulseProps) {
  const t = useTranslations("matchPulse");

  if (!show) return null;

  return (
    <div className="fixed bottom-8 right-8 z-40 group hidden md:block">
      <div className="flex items-center gap-4 bg-surface-container-highest/80 backdrop-blur-xl p-3 rounded-full border border-outline-variant/30 shadow-2xl">
        {/* Pulsing Soccer Ball */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-secondary-container">
          <span className="absolute w-full h-full bg-secondary opacity-20 animate-ping" />
          <span
            className="material-symbols-outlined text-on-secondary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            sports_soccer
          </span>
        </div>

        {/* Match Info */}
        <div className="pr-6">
          <p className="text-[10px] font-bold text-secondary tracking-widest uppercase">
            {t("live")}
          </p>
          <p className="text-xs font-headline font-bold text-on-surface">
            {matchText || t("defaultMatch")}
          </p>
        </div>
      </div>
    </div>
  );
}