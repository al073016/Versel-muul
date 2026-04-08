"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export default function PerfilPage() {
  const t = useTranslations("perfil");
  const supabase = createClient();
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
          setPerfil(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [supabase]);

  if (loading) {
    return <div className="pt-24 text-center">Cargando...</div>;
  }

  return (
    <main className="pt-20">
      {/* Header Profile Section */}
      <header className="relative overflow-hidden rounded-2xl m-8 p-10 md:p-16 bg-gradient-to-br from-primary-container to-primary text-white">
        <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-t from-black to-transparent"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-label rounded mb-4">EXPLORADOR DIAMANTE</span>
              <h1 className="text-5xl md:text-6xl font-headline italic font-medium tracking-tight">{perfil?.nombre_completo || "Usuario"}</h1>
              <p className="mt-2 text-primary-fixed font-body">Descubriendo los rincones mágicos de México.</p>
            </div>
            <button className="px-8 py-3 bg-secondary-container text-on-secondary-container rounded-full font-bold shadow-lg hover:brightness-105 transition-all self-start md:self-auto">
              Escribir nueva reseña
            </button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 mb-16 max-w-[1440px] mx-auto">
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-label text-primary font-bold text-sm mb-2">RUTAS COMPLETADAS</span>
          <span className="text-5xl md:text-6xl font-headline italic text-on-surface">24</span>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-label text-primary font-bold text-sm mb-2">PUNTOS DE INTERÉS</span>
          <span className="text-5xl md:text-6xl font-headline italic text-on-surface">158</span>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-label text-primary font-bold text-sm mb-2">INSIGNIAS OBTENIDAS</span>
          <span className="text-5xl md:text-6xl font-headline italic text-on-surface">12</span>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="max-w-[1440px] mx-auto px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-headline italic text-primary">Mis Reseñas</h2>
          <a href="#" className="font-label text-sm font-bold text-primary hover:underline underline-offset-4">
            Ver todas las reseñas
          </a>
        </div>

        <div className="space-y-6">
          {/* Review Card 1 */}
          <div className="group bg-surface-container-lowest p-6 md:p-8 rounded-xl flex flex-col md:flex-row gap-8 transition-all hover:bg-surface-container-low border border-outline-variant/10">
            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-surface-container-low">
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl">image</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-xl font-headline font-bold text-on-surface">Casa del Mayorazgo de la Canal</h4>
                  <p className="text-sm font-label text-slate-500">San Miguel de Allende, Gto.</p>
                </div>
                <span className="font-label text-xs text-slate-400">14 MAR 2024</span>
              </div>
              <div className="flex gap-0.5 mb-4 text-secondary-container">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    star
                  </span>
                ))}
              </div>
              <p className="text-on-surface-variant leading-relaxed font-body">Una joya arquitectónica que te transporta en el tiempo. La curaduría de la exposición actual es impecable.</p>
            </div>
          </div>

          {/* Review Card 2 */}
          <div className="group bg-surface-container-lowest p-6 md:p-8 rounded-xl flex flex-col md:flex-row gap-8 transition-all hover:bg-surface-container-low border border-outline-variant/10">
            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-surface-container-low">
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl">restaurant</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-xl font-headline font-bold text-on-surface">Restaurante Los Danzantes</h4>
                  <p className="text-sm font-label text-slate-500">Oaxaca de Juárez, Oax.</p>
                </div>
                <span className="font-label text-xs text-slate-400">02 FEB 2024</span>
              </div>
              <div className="flex gap-0.5 mb-4 text-secondary-container">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    star
                  </span>
                ))}
                <span className="material-symbols-outlined">star</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed font-body">El mole negro es de otro planeta. El ambiente en el patio central es muy acogedor. Recomiendo reservar con antelación.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
