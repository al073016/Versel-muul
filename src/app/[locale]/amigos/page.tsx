"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { FriendsService } from "@/lib/services/friends.service";

type Friend = {
  id: string;
  name: string;
  username: string;
  status: string;
  online: boolean;
  avatar: string;
  lat?: number;
  lng?: number;
};

type SearchResult = { id: string; name: string; username: string; avatar: string };

export default function AmigosPage() {
  const tn = useTranslations("nav");
  const t = useTranslations("amigos");

  const [amigos, setAmigos] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendSearch, setFriendSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [requestSent, setRequestSent] = useState<Record<string, boolean>>({});
  const [searchLoading, setSearchLoading] = useState(false);

  // Load friends from service (localStorage-seeded, future: Supabase)
  useEffect(() => {
    FriendsService.getAmigos().then((data) => {
      setAmigos(data);
      setLoading(false);
    });
  }, []);

  // Live search as user types
  useEffect(() => {
    if (!friendSearch.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const results = await FriendsService.buscarUsuarios(friendSearch);
      setSearchResults(results);
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [friendSearch]);

  const handleEliminar = async (id: string) => {
    await FriendsService.eliminarAmigo(id);
    setAmigos(prev => prev.filter(f => f.id !== id));
  };

  const handleAgregar = async (user: SearchResult) => {
    if (requestSent[user.id]) return;
    setRequestSent(prev => ({ ...prev, [user.id]: true }));
    const newFriend = await FriendsService.solicitarAmistad(user.id, user.name, user.avatar);
    setAmigos(prev => [newFriend, ...prev]);
  };

  return (
    <main className="pt-32 pb-20 bg-[#f8faff] min-h-screen px-6 md:px-12">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-12">
          <span className="font-label text-[#005596] tracking-widest text-xs uppercase mb-3 block font-black">👥 Muul Social</span>
          <h1 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black">{tn("amigos")}</h1>
          <p className="text-neutral-500 mt-4 font-body text-lg">{t("subtitulo")}</p>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base">search</span>
            <input
              type="text"
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              placeholder="Buscar por nombre o @usuario..."
              className="w-full bg-white border border-neutral-200 pl-12 pr-6 py-3 rounded-full font-body text-sm outline-none focus:border-[#fed000] transition-colors shadow-sm"
            />
            {searchLoading && (
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 animate-spin text-base">progress_activity</span>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-neutral-100 rounded-[1.5rem] shadow-lg overflow-hidden animate-fade-in">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-headline font-bold text-[#003e6f] text-sm">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAgregar(user)}
                    disabled={requestSent[user.id]}
                    className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${
                      requestSent[user.id]
                        ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                        : 'bg-[#003e6f] text-white hover:bg-[#005596]'
                    }`}
                  >
                    {requestSent[user.id] ? '✓ Agregado' : 'Agregar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {amigos.map((friend) => (
              <div
                key={friend.id}
                className={`bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-[#003e6f]/10 transition-all duration-300 ${!friend.online ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-100 shadow-inner">
                      <img src={friend.avatar} alt={friend.name} className={`w-full h-full object-cover ${!friend.online ? 'grayscale' : ''}`} />
                    </div>
                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${friend.online ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl text-[#003e6f] font-bold">{friend.name}</h3>
                    <div className="flex items-center gap-2 text-neutral-400 mt-1">
                      <span className="material-symbols-outlined text-sm">{friend.online ? 'location_on' : 'schedule'}</span>
                      <span className="text-sm font-body">{friend.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {friend.lat && friend.lng && (
                    <a
                      href={`/mapa?lat=${friend.lat}&lng=${friend.lng}`}
                      className="bg-[#003e6f]/5 text-[#003e6f] px-5 py-2 rounded-full font-headline font-bold text-sm hover:bg-[#003e6f] hover:text-white transition-all whitespace-nowrap"
                    >
                      {t("verMapa")}
                    </a>
                  )}
                  <button
                    onClick={() => handleEliminar(friend.id)}
                    className="text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-full"
                    title="Eliminar amigo"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && amigos.length === 0 && !friendSearch && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in text-center">
            <span className="material-symbols-outlined text-6xl text-neutral-300 mb-4">group_off</span>
            <p className="font-headline text-2xl text-[#003e6f] font-bold mb-2">Lista Vacía</p>
            <p className="text-neutral-500 font-body max-w-sm">Busca amigos por nombre o @usuario para conectar.</p>
          </div>
        )}

        {/* Add friends CTA */}
        <button
          onClick={() => document.querySelector('input')?.focus()}
          className="mt-12 w-full py-5 border-2 border-dashed border-neutral-200 rounded-[2rem] text-neutral-400 font-headline font-bold flex items-center justify-center gap-3 hover:border-[#003e6f]/20 hover:text-[#003e6f] transition-all group"
        >
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
          {t("agregarAmigos")}
        </button>
      </div>
    </main>
  );
}
