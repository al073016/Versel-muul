"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DUMMY_SOCIAL_USERS, SocialUser } from "@/lib/social-dummy";
import Image from "next/image";

export default function CollabPartyMode({ routeId }: { routeId?: string }) {
  const t = useTranslations("mapa");
  const [collaborators, setCollaborators] = useState<SocialUser[]>([
    DUMMY_SOCIAL_USERS['u1']
  ]);
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    // Hackathon Magic: Simulate a friend dynamically joining the route after 3.5s
    const timer = setTimeout(() => {
      setCollaborators(prev => [...prev, DUMMY_SOCIAL_USERS['u2']]);
      setJustJoined(true);
      
      const hideNotification = setTimeout(() => setJustJoined(false), 3000);
      return () => clearTimeout(hideNotification);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      
      {/* Toast Notification for new friend joining */}
      <div className={`bg-[#003e6f] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg transition-all duration-500 transform ${justJoined ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        Carlos R. se ha unido a tu ruta
      </div>

      <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#fed000]/30 flex items-center gap-3 animate-fade-in-up">
        <div className="flex -space-x-2">
          {collaborators.map((user, idx) => (
            <div 
              key={user.id} 
              className={`relative w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden ring-2 ring-[#fed000]/50 transition-all duration-500 ${idx === collaborators.length - 1 && justJoined ? 'scale-110 ring-4' : 'scale-100'}`}
            >
              <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
            </div>
          ))}
          <div className="relative w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[#f8fafd] flex items-center justify-center cursor-pointer hover:bg-[#fed000]/20 transition-colors group">
            <span className="material-symbols-outlined text-[#003e6f]/50 text-sm group-hover:text-[#003e6f]">add</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-[#fed000] tracking-widest leading-none drop-shadow-sm">Party Mode</span>
          <span className="text-xs font-bold text-[#003e6f] leading-tight">Editando juntos</span>
        </div>
      </div>
    </div>
  );
}
