"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import type { Negocio } from "@/types/database";
import { DUMMY_POIS } from "@/lib/dummy-data";
import { getPremiumPhoto } from "@/lib/photo-engine";

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
    comida: t("gastronomia"), 
    tienda: t("artesanias"), 
    servicios: t("servicios"),
    cultural: t("cultural"),
    deportes: t("deportes"),
  };

  useEffect(() => {
    const fetchNegocios = async () => {
      const { data } = await supabase.from("negocios").select("*").eq("activo", true).order("created_at", { ascending: false });
      
      const mocked: Negocio[] = DUMMY_POIS.map(p => ({
        id: p.id,
        propietario_id: 'dummy',
        nombre: p.nombre,
        descripcion: p.descripcion,
        categoria: p.categoria as any,
        latitud: p.latitud,
        longitud: p.longitud,
        horario_apertura: p.horario_apertura,
        horario_cierre: p.horario_cierre,
        verificado: true,
        activo: true,
        created_at: new Date().toISOString(),
      } as any));

      const merged = [...mocked, ...(data || [])];
      setNegocios(merged);
      setFilteredNegocios(merged);
      setLoadingStores(false);
    };
    fetchNegocios();
  }, [supabase]);

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
                      <img 
                        src={negocio.foto_url || getPremiumPhoto(negocio.nombre, negocio.categoria)} 
                        alt={negocio.nombre} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#003e6f]/60 via-transparent to-transparent z-10" />
                      <span className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-md border border-neutral-100 px-4 py-1.5 rounded-full text-[10px] font-black text-[#003e6f] tracking-widest uppercase">{categoryLabels[negocio.categoria] || negocio.categoria}</span>
                      {negocio.verificado && (<span className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#003e6f] flex items-center gap-1">🌊 MUUL</span>)}
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

      </main>
  );
}