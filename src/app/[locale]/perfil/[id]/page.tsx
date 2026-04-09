"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import type { Negocio, Producto } from "@/types/database";
import { DUMMY_POIS } from "@/lib/dummy-data";
import { getPremiumPhoto } from "@/lib/photo-engine";
import { haversine } from "@/lib/haversine";

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

export default function PerfilDinamicoPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const t = useTranslations("negocio");
  const tc = useTranslations("common");

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [prodNombre, setProdNombre] = useState("");
  const [prodDescripcion, setProdDescripcion] = useState("");
  const [prodPrecio, setProdPrecio] = useState("");
  const [prodGuardando, setProdGuardando] = useState(false);
  const [prodMsg, setProdMsg] = useState("");

  const [distancia, setDistancia] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: negocioData, error: negocioError } = await supabase.rpc('get_negocio_by_id_or_slug', { p_id_or_slug: id });

        if (negocioError || !negocioData || negocioData.length === 0) {
          console.error("Error fetching negocio:", negocioError);
          setNotFound(true);
          setLoading(false);
          return;
        }

        const currentNegocio = negocioData[0];
        setNegocio(currentNegocio);

        // Fetch products for the business
        const { data: productosData, error: productosError } = await supabase.rpc('get_productos_by_negocio_id', { p_negocio_id: currentNegocio.id });

        if (productosError) {
          console.error("Error fetching productos:", productosError);
        } else {
          setProductos(productosData || []);
        }

        // Geolocation logic
        if (typeof window !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const uLat = pos.coords.latitude;
            const uLng = pos.coords.longitude;
            
            if (currentNegocio.latitud && currentNegocio.longitud) {
              const d = haversine([uLat, uLng], [currentNegocio.latitud, currentNegocio.longitud]);
              setDistancia(d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`);
            }
          }, (err) => {
            console.warn("Geolocation error:", err);
          }, { timeout: 10000 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === currentNegocio.propietario_id) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("An unexpected error occurred:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, supabase]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim() || !negocio) return;
    setProdGuardando(true);
    setProdMsg("");

    const { data, error } = await supabase.rpc('add_new_producto', {
      p_negocio_id: negocio.id,
      p_nombre: prodNombre.trim(),
      p_descripcion: prodDescripcion.trim() || null,
      p_precio: prodPrecio ? parseFloat(prodPrecio) : null
    });

    setProdGuardando(false);
    if (error) {
      setProdMsg(tc("error"));
      console.error("Error adding product:", error);
      return;
    }
    
    // Assuming the RPC returns the new product, we refetch to be safe
    const { data: productosData } = await supabase.rpc('get_productos_by_negocio_id', { p_negocio_id: negocio.id });
    if (productosData) setProductos(productosData);

    setProdNombre("");
    setProdDescripcion("");
    setProdPrecio("");
    setShowProductForm(false);
    setProdMsg(t("productoAgregado"));
    setTimeout(() => setProdMsg(""), 3000);
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!negocio) return;
    await supabase.rpc('deactivate_producto', { p_producto_id: prodId });
    setProductos((prev) => prev.filter((p) => p.id !== prodId));
  };

  const formatHorario = () => {
    if (!negocio?.horario_apertura || !negocio?.horario_cierre) return t("horarioNoEspecificado");
    return `${negocio.horario_apertura} - ${negocio.horario_cierre}`;
  };

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto min-h-screen px-6 py-24">
        <div className="animate-pulse space-y-8">
          <div className="h-[350px] bg-surface-container-high rounded-xl" />
          <div className="h-8 bg-surface-container-high rounded w-1/3" />
          <div className="h-4 bg-surface-container-high rounded w-2/3" />
        </div>
      </main>
    );
  }

  if (notFound || !negocio) {
    return (
      <main className="max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center px-6 py-24 text-center space-y-6">
        <span className="text-6xl">🏪</span>
        <h1 className="font-headline font-black text-3xl">{t("noEncontrado")}</h1>
        <p className="text-on-surface-variant max-w-md">{t("noEncontradoDesc")}</p>
        <Link href="/tiendas" className="px-8 py-3 bg-primary text-on-primary rounded-xl font-headline font-bold hover:shadow-glow-secondary transition-all">{t("verTiendas")}</Link>
      </main>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto min-h-screen pb-28 md:pb-0">
        {/* HERO */}
        <header className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={negocio.foto_url || getPremiumPhoto(negocio.nombre, negocio.categoria)} 
              alt={negocio.nombre} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-[#003e6f]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                {negocio.verificado && (
                  <span className="bg-[#fed000] text-[#003e6f] px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-[#fed000]/20">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    {t("verificado")}
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-white border border-white/10">{tc(negocio.categoria)}</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-headline font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">{negocio.nombre}</h1>
              {negocio.descripcion && (<p className="text-white/80 max-w-xl text-lg font-medium leading-relaxed drop-shadow-lg">{negocio.descripcion}</p>)}
            </div>
            {isOwner && (<Link href="#productos" className="md:block bg-primary text-on-primary font-headline font-bold py-4 px-8 rounded-xl shadow-lg active:scale-95 transition-all">{t("gestionar")}</Link>)}
          </div>
        </header>

        {/* CONTENT */}
        <div className="px-6 md:px-12 py-12 flex flex-col lg:flex-row gap-12">
          <div className="flex-grow space-y-20">
            {/* Info */}
            <section className="space-y-8 animate-fade-in-up">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">{t("infoGeneral")}</h2>
                <div className="h-[2px] flex-grow bg-gradient-to-r from-outline-variant/30 to-transparent" />
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-panel p-8 rounded-xl space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                    <div>
                      <h4 className="font-headline font-bold text-sm uppercase text-on-surface-variant">{t("horarios")}</h4>
                      <p className="text-on-surface mt-1">{formatHorario()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <div>
                      <h4 className="font-headline font-bold text-sm uppercase text-on-surface-variant">{t("ubicacion")}</h4>
                      <p className="text-on-surface mt-1">{negocio.direccion || t("direccionNoEspecificada")}</p>
                    </div>
                  </div>
                  {negocio.rfc && (
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                      <div>
                        <h4 className="font-headline font-bold text-sm uppercase text-on-surface-variant">{t("rfc")}</h4>
                        <p className="text-on-surface mt-1 font-mono text-sm">{negocio.rfc}</p>
                      </div>
                    </div>
                  )}
                </div>
                {negocio.especialidades && negocio.especialidades.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-sm uppercase text-on-surface-variant tracking-widest">{t("especialidades")}</h4>
                    <div className="flex flex-wrap gap-3">
                      {negocio.especialidades.map((spec) => (<span key={spec} className="bg-surface-container-highest border border-outline-variant/20 px-4 py-2 rounded-lg text-sm">{spec}</span>))}
                    </div>
                  </div>
                )}
                {distancia && (
                  <div className="flex items-center justify-between p-6 bg-secondary/5 border border-secondary/10 rounded-2xl animate-fade-in md:col-span-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>near_me</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-secondary tracking-widest">Estás a</p>
                        <p className="text-xl font-headline font-black text-[#003e6f]">{distancia}</p>
                      </div>
                    </div>
                    <Link 
                      href={{
                        pathname: '/mapa',
                        query: { lat: negocio.latitud, lng: negocio.longitud, id: negocio.id }
                      }}
                      className="bg-secondary text-on-secondary px-6 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest shadow-lg shadow-secondary/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">map</span>
                      Ver en mapa
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Products */}
            <section className="space-y-8" id="productos">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">{isOwner ? t("misProductos") : t("productos")}</h2>
                {isOwner && (
                  <button onClick={() => setShowProductForm(!showProductForm)} className="text-secondary font-headline font-bold text-sm flex items-center gap-1 uppercase tracking-widest hover:underline">
                    <span className="material-symbols-outlined text-sm">{showProductForm ? "close" : "add"}</span>
                    {showProductForm ? t("cancelar") : t("agregarProducto")}
                  </button>
                )}
              </div>

              {isOwner && showProductForm && (
                <form onSubmit={handleAddProduct} className="bg-surface-container-high p-6 rounded-xl space-y-4 animate-fade-in-up border border-outline-variant/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" required value={prodNombre} onChange={(e) => setProdNombre(e.target.value)} placeholder={t("nombreProducto")} className="bg-surface-container-highest border-none rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-secondary/40 placeholder:text-on-surface-variant/40" />
                    <input type="text" value={prodDescripcion} onChange={(e) => setProdDescripcion(e.target.value)} placeholder={t("descProducto")} className="bg-surface-container-highest border-none rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-secondary/40 placeholder:text-on-surface-variant/40" />
                    <input type="number" value={prodPrecio} onChange={(e) => setProdPrecio(e.target.value)} placeholder={t("precioProducto")} step="0.01" min="0" className="bg-surface-container-highest border-none rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-secondary/40 placeholder:text-on-surface-variant/40" />
                  </div>
                  <button type="submit" disabled={prodGuardando} className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50">
                    {prodGuardando ? tc("cargando") : t("agregar")}
                  </button>
                </form>
              )}

              {prodMsg && (<p className="text-secondary text-xs font-bold animate-fade-in-up">{prodMsg}</p>)}

              {productos.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12 space-y-4">
                  <span className="text-5xl">{categoryEmojis[negocio.categoria] || "📦"}</span>
                  <h3 className="font-headline font-bold text-xl">{t("sinProductos")}</h3>
                  <p className="text-on-surface-variant max-w-md">{isOwner ? t("sinProductosOwner") : t("sinProductosVisitor")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
                  {productos.map((producto) => (
                    <div key={producto.id} className="group bg-surface-container-low rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
                      <div className="h-48 relative overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container-highest flex items-center justify-center">
                        <span className="text-7xl group-hover:scale-110 transition-transform duration-500">{categoryEmojis[negocio.categoria] || "📦"}</span>
                        {producto.precio && (<div className="absolute top-4 right-4 bg-surface/80 backdrop-blur px-3 py-1 rounded-md text-secondary font-bold text-sm">${producto.precio}</div>)}
                      </div>
                      <div className="p-6 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-headline font-bold text-xl">{producto.nombre}</h3>
                          {isOwner && (<button onClick={() => handleDeleteProduct(producto.id)} className="text-on-surface-variant hover:text-tertiary transition-colors shrink-0"><span className="material-symbols-outlined text-sm">delete</span></button>)}
                        </div>
                        {producto.descripcion && (<p className="text-on-surface-variant text-sm line-clamp-2">{producto.descripcion}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="w-full lg:w-96">
            <div className="sticky top-28 space-y-8">
              <div className="bg-surface-container-low rounded-2xl p-8 space-y-8 border border-outline-variant/10">
                <div className="space-y-2">
                  <h3 className="font-headline font-black uppercase text-xs tracking-[0.2em] text-on-surface-variant">{t("estadisticas")}</h3>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1">
                      <div className="text-2xl font-headline font-black text-on-surface">{productos.length}</div>
                      <div className="text-[10px] uppercase font-bold text-on-surface-variant">{t("productos")}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-headline font-black text-secondary">{negocio.verificado ? "✅" : "⏳"}</div>
                      <div className="text-[10px] uppercase font-bold text-on-surface-variant">{negocio.verificado ? t("verificado") : t("enRevision")}</div>
                    </div>
                  </div>
                </div>

                {negocio.latitud && negocio.longitud && (
                  <div className="space-y-2">
                    <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface-variant">{t("coordenadas")}</h4>
                    <p className="text-[10px] text-secondary font-mono">{negocio.latitud.toFixed(4)}° N, {Math.abs(negocio.longitud).toFixed(4)}° W</p>
                  </div>
                )}

                {(negocio.instagram || negocio.facebook || (negocio as any).telefono) && (
                  <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                    <h4 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-on-surface-variant">Contacto</h4>
                    <div className="space-y-3">
                      {(negocio as any).telefono && (
                        <div className="flex items-center gap-3 text-on-surface">
                          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>phone_in_talk</span>
                          <span className="text-sm font-bold">{(negocio as any).telefono}</span>
                        </div>
                      )}
                      <div className="flex gap-4">
                        {negocio.instagram && (
                          <a href={`https://instagram.com/${negocio.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-600 hover:bg-pink-500/20 transition-all">
                            <span className="material-symbols-outlined text-xl">camera_alt</span>
                          </a>
                        )}
                        {negocio.facebook && (
                          <a href={`https://facebook.com/${negocio.facebook}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-700 hover:bg-blue-600/20 transition-all">
                            <span className="material-symbols-outlined text-xl">facebook</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  {isOwner && (
                    <Link href="#productos" className="w-full bg-primary text-on-primary font-headline font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-sm">
                      <span className="material-symbols-outlined">edit</span>{t("gestionar")}
                    </Link>
                  )}
                  <button className="w-full border border-outline-variant/30 text-on-surface font-headline font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all uppercase tracking-widest text-sm">
                    <span className="material-symbols-outlined">share</span>{tc("compartir")}
                  </button>
                </div>
              </div>

              {/* Promotional section removed */}
            </div>
          </aside>
        </div>
      </main>
  );
}
