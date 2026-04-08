"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Navbar, Footer, MobileNav } from "@/components/layout";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import type { Perfil } from "@/types/database";

interface UserStats {
  rutas: number;
  visitas: number;
  insignias: number;
}

export default function PerfilPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const supabase = createClient();
  const t = useTranslations("perfil");

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [idioma, setIdioma] = useState("es-MX");
  const [stats] = useState<UserStats>({ rutas: 24, visitas: 112, insignias: 5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const mockInsignias = [
    {
      categoria: t("catCultural"),
      icon: "museum",
      color: "text-primary",
      badges: [
        { emoji: "🏛️", nombre: t("badgeHistoriador"), rango: t("rangoPlata"), rangoColor: "text-primary", progreso: 65, bloqueado: false },
        { emoji: "🏺", nombre: t("badgeAntropologo"), rango: t("rangoBronce"), rangoColor: "text-on-surface-variant", progreso: 0, bloqueado: true },
      ],
    },
    {
      categoria: t("catComida"),
      icon: "restaurant",
      color: "text-secondary",
      badges: [
        { emoji: "🌮", nombre: t("badgeTacoLover"), rango: t("rangoOro"), rangoColor: "text-secondary", progreso: 90, bloqueado: false },
        { emoji: "🌶️", nombre: t("badgePicanteMaster"), rango: t("rangoBronce"), rangoColor: "text-secondary", progreso: 20, bloqueado: false },
      ],
    },
    {
      categoria: t("catTiendas"),
      icon: "shopping_bag",
      color: "text-tertiary",
      badges: [
        { emoji: "🛍️", nombre: t("badgeBuscadorJoyas"), rango: t("rangoPlatino"), rangoColor: "text-tertiary", progreso: 100, bloqueado: false },
        { emoji: "🎨", nombre: t("badgeColeccionista"), rango: t("rangoOro"), rangoColor: "text-tertiary", progreso: 0, bloqueado: true },
      ],
    },
  ];

  const mockResenas = [
    {
      id: "r1",
      lugar: t("resena1Lugar"),
      emoji: "🦐",
      categoria: t("catComida"),
      rating: 5,
      fecha: t("resena1Fecha"),
      texto: t("resena1Texto"),
    },
    {
      id: "r2",
      lugar: t("resena2Lugar"),
      emoji: "🏛️",
      categoria: t("catCultural"),
      rating: 5,
      fecha: t("resena2Fecha"),
      texto: t("resena2Texto"),
    },
    {
      id: "r3",
      lugar: t("resena3Lugar"),
      emoji: "🛍️",
      categoria: t("catTienda"),
      rating: 4,
      fecha: t("resena3Fecha"),
      texto: t("resena3Texto"),
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = `/${locale}/login`; return; }
      setEditEmail(user.email || "");
      const { data: perfilData } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      if (perfilData) { setPerfil(perfilData); setIdioma(perfilData.idioma || "es-MX"); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!perfil) return;
    setSaving(true); setSaveMsg("");
    const { error } = await supabase.from("perfiles").update({ idioma }).eq("id", perfil.id);
    if (error) {
      setSaveMsg(t("errorGeneric"));
    } else {
      setSaveMsg(t("cambiosGuardados"));
      setTimeout(() => setSaveMsg(""), 3000);
      const localeMap: Record<string, "es" | "en" | "zh" | "pt"> = {
        "es-MX": "es", "en-US": "en", "zh-CN": "zh", "pt-BR": "pt",
      };
      const newLocale = localeMap[idioma];
      if (newLocale) router.replace(pathname, { locale: newLocale });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getInitial = () => perfil ? perfil.nombre_completo.charAt(0).toUpperCase() : "?";
  const getMemberSince = () => perfil ? new Date(perfil.created_at).getFullYear().toString() : "";

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-24 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-surface-container-high" />
            <div className="h-4 w-48 bg-surface-container-high rounded" />
            <p className="text-on-surface-variant text-sm">{t("cargando")}</p>
          </div>
        </main>
      </>
    );
  }

  if (!perfil) return null;

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24 pb-28 md:pb-12">

        {/* ══════════════════════════════════════
            HERO + SETTINGS
            ══════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
          <div className="lg:col-span-8 space-y-8">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-surface-container-low p-8 lg:p-12 min-h-[320px] flex flex-col justify-end">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[100px] rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 blur-[100px] rounded-full" />
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-tertiary to-tertiary-container rounded-[2rem] flex items-center justify-center shadow-xl">
                  <span className="text-6xl font-black text-on-tertiary-fixed font-headline">{getInitial()}</span>
                </div>
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-widest uppercase mb-4">
                    <span className="material-symbols-outlined text-[14px] mr-1">verified_user</span>
                    {perfil.tipo_cuenta === "negocio" ? t("negocio") : t("turista")}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-on-surface">{perfil.nombre_completo}</h1>
                  <p className="text-on-surface-variant font-medium mt-2">
                    {perfil.ciudad || t("explorador")} • {t("miembroDesde", { year: getMemberSince() })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-black font-syne text-primary mb-2">{stats.rutas}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("rutas")}</span>
              </div>
              <div className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-black font-syne text-secondary mb-2">{stats.visitas}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("visitas")}</span>
              </div>
              <div className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-black font-syne text-tertiary mb-2">{stats.insignias}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("insignias")}</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="lg:col-span-4 bg-surface-container-low p-8 rounded-xl space-y-6">
            <h3 className="font-headline font-bold text-xl mb-4">{t("ajustes")}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t("idioma")}</label>
                <div className="relative">
                  <select value={idioma} onChange={(e) => setIdioma(e.target.value)} className="w-full bg-surface-container-highest border-none rounded-lg py-4 px-4 text-on-surface focus:ring-2 focus:ring-secondary/40 transition-all appearance-none">
                    <option value="es-MX">🇲🇽 {t("langEs")}</option>
                    <option value="en-US">🇺🇸 {t("langEn")}</option>
                    <option value="pt-BR">🇧🇷 {t("langPt")}</option>
                    <option value="zh-CN">🇨🇳 {t("langZh")}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t("correo")}</label>
                <input type="email" value={editEmail} readOnly className="w-full bg-surface-container-highest border-none rounded-lg py-4 px-4 text-on-surface-variant focus:ring-2 focus:ring-secondary/40 cursor-not-allowed opacity-70" />
              </div>

              {saveMsg && (<p className={`text-xs font-bold text-center animate-fade-in-up ${saveMsg === t("errorGeneric") ? "text-error" : "text-secondary"}`}>{saveMsg}</p>)}

              <div className="pt-6 space-y-3">
                <button onClick={handleSave} disabled={saving} className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-300 disabled:opacity-50">
                  {saving ? t("guardando") : t("guardar")}
                </button>
                <button onClick={handleLogout} className="w-full border-2 border-tertiary/30 text-tertiary font-headline font-bold py-4 rounded-xl hover:bg-tertiary/10 transition-all duration-300">
                  {t("cerrarSesion")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            INSIGNIA ESPECIAL
            ══════════════════════════════════════ */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/10 pb-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black font-headline tracking-tighter uppercase">{t("tusInsignias")}</h2>
              <p className="text-on-surface-variant font-medium">{t("avanceLogros")}</p>
            </div>
            <div className="w-full md:w-64">
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full shadow-[0_0_10px_rgba(152,213,162,0.4)] transition-all duration-500" style={{ width: "45%" }} />
              </div>
            </div>
          </div>

          {/* Featured badge */}
          <div className="relative bg-gradient-to-r from-primary-container to-surface-container-low p-1 rounded-3xl group">
            <div className="bg-[#131315] rounded-[1.4rem] p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
              </div>
              <div className="w-24 h-24 bg-surface-container-highest rounded-2xl flex items-center justify-center text-5xl shadow-inner border border-outline-variant/20">🌊</div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-2 py-0.5 bg-tertiary/20 text-tertiary text-[10px] font-black uppercase tracking-widest rounded-md mb-2">{t("eventoEspecial")}</div>
                <h3 className="text-2xl font-black font-headline uppercase tracking-tight">{t("insigniaEspecialNombre")}</h3>
                <p className="text-on-surface-variant text-sm font-medium">{t("insigniaEspecialDesc")}</p>
              </div>
              <div className="bg-secondary/10 px-6 py-3 rounded-xl border border-secondary/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span className="text-secondary font-bold font-headline uppercase tracking-wider text-sm">{t("rangoLegendario")}</span>
              </div>
            </div>
          </div>

          {/* Badge categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {mockInsignias.map((cat) => (
              <div key={cat.categoria} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
                  <h4 className="font-headline font-bold uppercase tracking-widest text-sm text-on-surface-variant">{cat.categoria}</h4>
                </div>
                <div className="space-y-4">
                  {cat.badges.map((badge) => (
                    <div key={badge.nombre} className={`p-6 rounded-2xl border transition-transform hover:-translate-y-1 ${badge.bloqueado ? "bg-surface-container-low/50 border-dashed border-outline-variant/20 grayscale opacity-60" : "bg-surface-container-low border-outline-variant/10"}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center text-2xl">
                          {badge.bloqueado ? <span className="material-symbols-outlined text-on-surface-variant">lock</span> : badge.emoji}
                        </div>
                        <div>
                          <p className="font-bold text-sm font-headline">{badge.nombre}</p>
                          <p className={`text-[10px] uppercase font-black tracking-widest ${badge.rangoColor}`}>{badge.rango}</p>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${badge.bloqueado ? "bg-on-surface-variant" : badge.progreso === 100 ? "bg-tertiary shadow-[0_0_8px_rgba(255,179,179,0.5)]" : "bg-secondary"}`} style={{ width: `${badge.progreso}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            RESEÑAS
            ══════════════════════════════════════ */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/10 pb-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black font-headline tracking-tighter uppercase">{t("misResenas")}</h2>
              <p className="text-on-surface-variant font-medium">{t("resenasDesc")}</p>
            </div>
            <button className="flex items-center gap-2 bg-secondary text-on-secondary font-headline font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">rate_review</span>
              {t("escribirResena")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockResenas.map((resena) => (
              <div key={resena.id} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 hover:-translate-y-1 transition-transform">
                {/* Place */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-xl shrink-0">{resena.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-bold text-on-surface text-sm truncate">{resena.lugar}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{resena.categoria}</p>
                  </div>
                </div>
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-base ${i < resena.rating ? "text-secondary" : "text-outline-variant"}`} style={{ fontVariationSettings: i < resena.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                  ))}
                  <span className="text-xs text-on-surface-variant ml-2">{resena.fecha}</span>
                </div>
                {/* Text */}
                <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-4">{resena.texto}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
      <MobileNav />
    </>
  );
}