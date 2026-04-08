"use client";

import { useTranslations } from "next-intl";

const DUMMY_FRIENDS = [
  {
    id: 1,
    name: "Carlos Rivera",
    initials: "CR",
    location: "CDMX - Zócalo",
    status: "Online",
    lat: 19.4326,
    lng: -99.1332,
    avatar: "https://i.pravatar.cc/150?u=carlos"
  },
  {
    id: 2,
    name: "Ana Martínez",
    initials: "AM",
    location: "Guadalajara - Arcos",
    status: "Offline",
    lat: 20.6719,
    lng: -103.3918,
    avatar: "https://i.pravatar.cc/150?u=ana"
  },
  {
    id: 3,
    name: "Diego Sánchez",
    initials: "DS",
    location: "Monterrey - Macroplaza",
    status: "Online",
    lat: 25.6714,
    lng: -100.3095,
    avatar: "https://i.pravatar.cc/150?u=diego"
  },
  {
    id: 4,
    name: "Sofía López",
    initials: "SL",
    location: "Cancún - Playa Delfines",
    status: "Offline",
    lat: 21.0610,
    lng: -86.7793,
    avatar: "https://i.pravatar.cc/150?u=sofia"
  }
];

export default function AmigosPage() {
  const t = useTranslations("nav");

  return (
    <main className="pt-32 pb-20 bg-[#f8faff] min-h-screen px-6 md:px-12">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-12">
          <span className="font-label text-[#005596] tracking-widest text-xs uppercase mb-3 block font-black">👥 Muul Social</span>
          <h1 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black">{t("amigos")}</h1>
          <p className="text-neutral-500 mt-4 font-body text-lg">Descubre dónde están tus amigos y planea tu próxima aventura juntos.</p>
        </div>

        <div className="grid gap-4">
          {DUMMY_FRIENDS.map((friend) => (
            <div key={friend.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-[#003e6f]/10 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-100 shadow-inner">
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${friend.status === 'Online' ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
                </div>
                <div>
                  <h3 className="font-headline text-xl text-[#003e6f] font-bold">{friend.name}</h3>
                  <div className="flex items-center gap-2 text-neutral-400 mt-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="text-sm font-body">{friend.location}</span>
                  </div>
                </div>
              </div>
              <button className="bg-[#003e6f]/5 text-[#003e6f] px-6 py-2.5 rounded-full font-headline font-bold text-sm hover:bg-[#003e6f] hover:text-white transition-all whitespace-nowrap">
                Ver Mapa
              </button>
            </div>
          ))}
        </div>

        <button className="mt-12 w-full py-5 border-2 border-dashed border-neutral-200 rounded-[2rem] text-neutral-400 font-headline font-bold flex items-center justify-center gap-3 hover:border-[#003e6f]/20 hover:text-[#003e6f] transition-all group">
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
          Agregar nuevos amigos
        </button>
      </div>
    </main>
  );
}
