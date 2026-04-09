"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface Participant {
  usuario_id: string;
}

export default function CollabPartyMode({
  routeId,
  participants = [],
  onInvite
}: {
  routeId?: string;
  participants?: Participant[];
  onInvite?: () => void;
}) {
  const t = useTranslations("partyMode");
  const [justJoined, setJustJoined] = useState(false);
  const prevCountRef = useRef(participants.length);

  useEffect(() => {
    // Show toast if participant count increased
    if (participants.length > prevCountRef.current && prevCountRef.current > 0) {
      setJustJoined(true);
      const timer = setTimeout(() => setJustJoined(false), 3000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = participants.length;
  }, [participants.length]);

  if (!routeId || participants.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      
      {/* Toast Notification for new friend joining */}
      <div className={`bg-[#003e6f] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg transition-all duration-500 transform ${justJoined ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {t("collabJoined")}
      </div>

      <button 
        onClick={onInvite}
        className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#fed000]/30 flex items-center gap-3 animate-fade-in-up transition-transform hover:scale-105"
      >
        <div className="flex -space-x-2">
          {participants.map((user, idx) => (
            <div 
              key={user.usuario_id} 
              className={`relative w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden ring-2 ring-[#fed000]/50 transition-all duration-500 ${idx === participants.length - 1 && justJoined ? 'scale-110 ring-4' : 'scale-100'}`}
            >
              <Image 
                src={`https://ui-avatars.com/api/?name=${user.usuario_id.slice(0, 2)}&background=003e6f&color=fff&size=64`} 
                alt="Avatar" 
                fill 
                className="object-cover" 
              />
            </div>
          ))}
          <div className="relative w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[#f8fafd] flex items-center justify-center cursor-pointer hover:bg-[#fed000]/20 transition-colors group">
            <span className="material-symbols-outlined text-[#003e6f]/50 text-sm group-hover:text-[#003e6f]">add</span>
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-black uppercase text-[#fed000] tracking-widest leading-none drop-shadow-sm">{t("collabMode")}</span>
          <span className="text-xs font-bold text-[#003e6f] leading-tight">
            {participants.length > 1 ? t("collabTogether") : t("collabSolo")}
          </span>
        </div>
      </button>
    </div>
  );
}
