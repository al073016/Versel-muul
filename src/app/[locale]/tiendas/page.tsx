"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import type { Negocio } from "@/types/database";

type BusinessCategory = "comida" | "tienda" | "servicios";

const categoryEmojis: Record<string, string> = {
  comida: "🌮", tienda: "🛍️", servicios: "🏨", cultural: "🏛️", deportes: "⚽",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function TiendasPage() {
  const supabase = createClient();
  const t = useTranslations("tiendas");
  const tc = useTranslations("common");

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [filteredNegocios, setFilteredNegocios] = useState<Negocio[]>([]);
  const [activeFilter, setActiveFilter] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingStores, setLoadingStores] = useState(true);

  const [nombre, setNombre] = useState("");
  const [rfc, setRfc] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>("tienda");
  const [horarioApertura, setHorarioApertura] = useState("");
  const [horarioCierre, setHorarioCierre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [gpsActive, setGpsActive] = useState(false);
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const filterOptions = [
    { label: t("todas"), value: "todas" },
    { label: t("gastronomia"), value: "comida" },
    { label: t("artesanias"), value: "tienda" },
    { label: t("servicios"), value: "servicios" },
  ];

  const businessCategories: { id: BusinessCategory; label: string; emoji: string }[] = [
    { id: "comida", label: tc("comida"), emoji: "🌮" },
    { id: "tienda", label: tc("tienda"), emoji: "🛍️" },
    { id: "servicios", label: tc("servicios"), emoji: "🏨" },
  ];

  const categoryLabels: Record<string, string> = {
    comida: t("gastronomia"), tienda: t("artesanias"), servicios: t("servicios"),
  };

  useEffect(() => {
    const fetchNegocios = async () => {
      const { data } = await supabase.from("negocios").select("*").eq("activo", true).order("created_at", { ascending: false });
      if (data) { setNegocios(data); setFilteredNegocios(data); }
      setLoadingStores(false);
    };
    fetchNegocios();
  }, []);

  useEffect(() => {
    let result = negocios;
    if (activeFilter !== "todas") result = result.filter((n) => n.categoria === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => n.nombre.toLowerCase().includes(q) || n.descripcion?.toLowerCase().includes(q));
    }
    setFilteredNegocios(result);
  }, [activeFilter, searchQuery, negocios]);

  const capturarGPS = () => {
    if (!navigator.geolocation) { setRegError(t("errorGpsNoSoportado")); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitud(pos.coords.latitude); setLongitud(pos.coords.longitude); setGpsActive(true); },
      () => { setRegError(t("errorGPS")); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRegError(t("errorLogin")); return; }
    if (!nombre.trim()) { setRegError(t("errorNombre")); return; }
    if (!gpsActive || !latitud || !longitud) { setRegError(t("errorGPS")); return; }
    if (!aceptaTerminos) { setRegError(t("errorTerminos")); return; }

    setRegistrando(true);
    const { error } = await supabase.from("negocios").insert({
      propietario_id: user.id, nombre: nombre.trim(), descripcion: descripcion.trim() || null,
      categoria: selectedCategory, rfc: rfc.trim() || null, direccion: direccion.trim() || null,
      latitud, longitud, horario_apertura: horarioApertura || null, horario_cierre: horarioCierre || null,
      verificado: false, activo: true,
    });
    setRegistrando(false);
    if (error) { setRegError(t("errorRegistro")); return; }

    setRegSuccess(true);
    setNombre(""); setRfc(""); setDescripcion(""); setDireccion("");
    setHorarioApertura(""); setHorarioCierre("");
    setGpsActive(false); setLatitud(null); setLongitud(null); setAceptaTerminos(false);

    const { data: newData } = await supabase.from("negocios").select("*").eq("activo", true).order("created_at", { ascending: false });
    if (newData) { setNegocios(newData); setFilteredNegocios(newData); }
  };

  return (
      <main className="min-h-screen">
        {/* ===== TIENDAS REGISTRADAS ===== */}
        <section className="relative pt-20 pb-16 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-12 animate-fade-in-up">
              <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter mb-4 text-[#003e6f]">
                {t("titulo")} <br /><span className="text-[#005596]">{t("registradas")}</span>
              </h1>
              <p className="text-neutral-500 max-w-xl text-lg">{t("subtitulo")}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-12">
              <div className="flex-grow relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#003e6f]/40">search</span>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("buscar")} className="w-full !bg-slate-100 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-[#003e6f] focus:ring-2 focus:ring-[#003e6f]/20 placeholder:text-[#003e6f]/40 outline-none transition-all" />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {filterOptions.map((f) => (
                  <button key={f.value} onClick={() => setActiveFilter(f.value)} className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeFilter === f.value ? "bg-[#003e6f] text-white" : "bg-slate-200/50 text-[#003e6f] hover:bg-slate-200"}`}>{f.label}</button>
                ))}
              </div>
            </div>

            {loadingStores ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map((i) => (<div key={i} className="animate-pulse bg-surface-container-low rounded-xl overflow-hidden"><div className="h-64 bg-surface-container-high" /><div className="p-6 space-y-3"><div className="h-6 bg-surface-container-high rounded w-3/4" /><div className="h-4 bg-surface-container-high rounded w-1/2" /><div className="h-10 bg-surface-container-high rounded" /></div></div>))}
              </div>
            ) : filteredNegocios.length === 0 ? (
              <div className="flex flex-col items-center text-center py-20 space-y-4">
                <span className="text-6xl">{activeFilter !== "todas" ? categoryEmojis[activeFilter] || "🔍" : "🏪"}</span>
                <h3 className="font-headline font-bold text-xl">{negocios.length === 0 ? t("sinTiendas") : t("sinResultados")}</h3>
                <p className="text-on-surface-variant max-w-md">{negocios.length === 0 ? t("sinTiendasDesc") : t("sinResultadosDesc")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
                {filteredNegocios.map((negocio) => (
                  <Link key={negocio.id} href={`/negocio/${slugify(negocio.nombre) || negocio.id}`} className="group bg-white border border-neutral-100 rounded-3xl overflow-hidden relative shadow-sm hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500">
                    <div className="h-64 relative bg-slate-50 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                      <span className="text-8xl group-hover:scale-110 transition-transform duration-700">{categoryEmojis[negocio.categoria] || "🏪"}</span>
                      <span className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-md border border-neutral-100 px-4 py-1.5 rounded-full text-[10px] font-black text-[#003e6f] tracking-widest uppercase">{categoryLabels[negocio.categoria] || negocio.categoria}</span>
                      {negocio.verificado && (<span className="absolute top-4 right-4 z-20 bg-[#003e6f]/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#003e6f] flex items-center gap-1">🌊 MUUL</span>)}
                    </div>
                    <div className="p-8 relative">
                      <h3 className="text-2xl font-black font-headline mb-2 text-[#003e6f]">{negocio.nombre}</h3>
                      <p className="text-[#005596] font-bold text-sm mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {negocio.horario_apertura && negocio.horario_cierre ? `${negocio.horario_apertura} - ${negocio.horario_cierre}` : t("horarioNoDisponible")}
                      </p>
                      {negocio.descripcion && (<p className="text-neutral-500 text-sm line-clamp-2 mb-6 font-body leading-relaxed">{negocio.descripcion}</p>)}
                      <div className="w-full bg-slate-100 text-[#003e6f] py-4 rounded-2xl font-black text-sm text-center group-hover:bg-[#fed000] group-hover:text-[#003e6f] transition-all duration-300 shadow-sm">{t("verProductos")}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===== REGISTRO ===== */}
        <section className="bg-white py-24 px-6 border-t border-neutral-100">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <span className="text-[#005596] font-bold tracking-[0.2em] uppercase text-xs mb-4 block">{t("hacCrecer")}</span>
              <h2 className="text-4xl md:text-5xl font-black font-headline text-[#003e6f]">{t("registroTitulo")}</h2>
              <p className="text-neutral-500 mt-4">{t("registroSubtitulo")}</p>
            </div>

            {regSuccess ? (
              <div className="bg-surface-container-low rounded-3xl p-12 shadow-2xl flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="font-headline font-black text-3xl">{t("registroExito")}</h3>
                <p className="text-on-surface-variant max-w-md">{t("registroExitoDesc")}</p>
                <button onClick={() => setRegSuccess(false)} className="px-8 py-3 bg-primary text-on-primary rounded-xl font-headline font-bold hover:shadow-glow-secondary transition-all">{t("registrarOtro")}</button>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-tertiary/10 blur-[80px] rounded-full" />
                <form className="space-y-8 relative z-10" onSubmit={handleRegistro}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("nombreNegocio")} *</label>
                      <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("nombreNegocioPlaceholder")} className="w-full !bg-slate-100 border border-slate-200 rounded-2xl py-4 px-8 text-[#003e6f] focus:ring-2 focus:ring-[#003e6f]/20 placeholder:text-[#003e6f]/30 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("rfc")}</label>
                      <input type="text" value={rfc} onChange={(e) => setRfc(e.target.value)} placeholder={t("rfcPlaceholder")} className="w-full !bg-slate-100 border border-slate-200 rounded-2xl py-4 px-8 text-[#003e6f] focus:ring-2 focus:ring-[#003e6f]/20 placeholder:text-[#003e6f]/30 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("descripcion")}</label>
                    <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={t("descripcionPlaceholder")} rows={3} className="w-full !bg-slate-100 border border-slate-200 rounded-2xl py-4 px-8 text-[#003e6f] focus:ring-2 focus:ring-[#003e6f]/20 placeholder:text-[#003e6f]/30 outline-none transition-all resize-none" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("categoria")} *</label>
                    <div className="grid grid-cols-3 gap-4">
                      {businessCategories.map((cat) => (
                        <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 transition-all ${selectedCategory === cat.id ? "border-[#003e6f] text-[#003e6f] bg-white shadow-lg" : "border-transparent hover:border-[#003e6f]/10"}`}>
                          <span className="text-3xl mb-2">{cat.emoji}</span>
                          <span className="text-xs font-black uppercase tracking-tighter">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("horarioApertura")}</label>
                      <input type="time" value={horarioApertura} onChange={(e) => setHorarioApertura(e.target.value)} className="w-full !bg-slate-100 border border-slate-200 rounded-2xl py-4 px-8 text-[#003e6f] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("horarioCierre")}</label>
                      <input type="time" value={horarioCierre} onChange={(e) => setHorarioCierre(e.target.value)} className="w-full !bg-slate-100 border border-slate-200 rounded-2xl py-4 px-8 text-[#003e6f] outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("direccion")}</label>
                    <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder={t("direccionPlaceholder")} className="w-full !bg-slate-100 border border-slate-200 rounded-2xl py-4 px-8 text-[#003e6f] focus:ring-2 focus:ring-[#003e6f]/20 placeholder:text-[#003e6f]/30 outline-none transition-all" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#005596] ml-4">{t("ubicacion")} *</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={capturarGPS} className="flex-grow bg-slate-100 text-[#003e6f] py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-sm">
                        <span className="material-symbols-outlined">location_on</span>{t("capturarGPS")}
                      </button>
                      <button type="button" className={`px-6 rounded-2xl flex items-center justify-center transition-all ${gpsActive ? "bg-[#fed000] text-[#003e6f] shadow-lg shadow-[#fed000]/20" : "bg-slate-100 text-slate-400"}`}>
                        <span className="material-symbols-outlined" style={gpsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>check_circle</span>
                      </button>
                    </div>
                    {gpsActive && latitud && longitud && (<div className="text-[10px] text-[#fed000] bg-[#003e6f] px-4 py-1.5 rounded-full w-fit ml-auto font-mono uppercase tracking-widest shadow-sm">GPS: {latitud.toFixed(4)}° N, {longitud.toFixed(4)}° W</div>)}
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative mt-1">
                        <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} className="peer sr-only" />
                        <div className="w-6 h-6 bg-surface-container-highest border-2 border-outline-variant rounded peer-checked:bg-secondary peer-checked:border-secondary transition-all" />
                        <span className="material-symbols-outlined absolute top-0 left-0 text-on-secondary opacity-0 peer-checked:opacity-100 text-sm w-6 h-6 flex items-center justify-center">check</span>
                      </div>
                      <span className="text-sm text-on-surface-variant leading-relaxed">{t("terminos")}</span>
                    </label>
                  </div>

                  {regError && (<div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium animate-fade-in-up">{regError}</div>)}

                  <button type="submit" disabled={registrando} className="w-full bg-[#003e6f] text-white !text-white py-5 rounded-xl font-headline font-black text-lg uppercase tracking-tighter hover:bg-[#fed000] hover:text-[#003e6f] active:scale-[0.98] transition-all shadow-xl shadow-[#003e6f]/10 disabled:opacity-50 disabled:cursor-not-allowed">
                    {registrando ? t("registrando") : t("registrar")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
  );
}