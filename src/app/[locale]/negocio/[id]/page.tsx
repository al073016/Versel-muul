"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useTranslations } from "next-intl";
import type { Negocio, Producto } from "@/types/database";
import { getLocalizedDummyPois } from "@/lib/dummy-data";
import { getPremiumPhoto } from "@/lib/photo-engine";
import { haversine } from "@/lib/haversine";
import { Link } from "@/i18n/navigation";

const slugify = (value: string | null | undefined) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// Mockup productos para taquería
const MOCKUP_PRODUCTOS: Producto[] = [
  {
    id: "mock-1",
    negocio_id: "",
    nombre: "Tacos al Pastor",
    descripcion: "Deliciosos tacos al pastor con piña y cebolla morada",
    precio: 45,
    activo: true,
    created_at: new Date().toISOString(),
  } as Producto,
  {
    id: "mock-2",
    negocio_id: "",
    nombre: "Tacos de Carnitas",
    descripcion: "Carnitas de cerdo tierno con cebolla y cilantro",
    precio: 50,
    activo: true,
    created_at: new Date().toISOString(),
  } as Producto,
  {
    id: "mock-3",
    negocio_id: "",
    nombre: "Tacos de Barbacoa",
    descripcion: "Barbacoa tradicional con chile y cebolla",
    precio: 55,
    activo: true,
    created_at: new Date().toISOString(),
  } as Producto,
  {
    id: "mock-4",
    negocio_id: "",
    nombre: "Quesadillas",
    descripcion: "Quesadillas rellenas de queso Oaxaca y tinga de pollo",
    precio: 40,
    activo: true,
    created_at: new Date().toISOString(),
  } as Producto,
  {
    id: "mock-5",
    negocio_id: "",
    nombre: "Chiles Rellenos",
    descripcion: "Chiles poblanos rellenos de queso con salsa roja",
    precio: 65,
    activo: true,
    created_at: new Date().toISOString(),
  } as Producto,
  {
    id: "mock-6",
    negocio_id: "",
    nombre: "Tortas",
    descripcion: "Tortas preparadas con carnes y verduras frescas",
    precio: 60,
    activo: true,
    created_at: new Date().toISOString(),
  } as Producto,
];

// URLs de imágenes para mockup productos
const MOCKUP_IMAGEN_URLS: Record<string, string> = {
  "mock-1": "https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/pastor.webp",
  "mock-2": "https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/carnitas.jpg",
  "mock-3": "https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/barbacoa.webp",
  "mock-4": "https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/QUESADILLA.webp",
  "mock-5": "https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/CHILES.webp",
  "mock-6": "https://loremflickr.com/400/500/torta,mexican",
};

export default function NegocioPerfilPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("negocio");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dummyPois = useMemo(() => getLocalizedDummyPois(locale), [locale]);

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

        if (!negocioError && negocioData && negocioData.length > 0) {
          const currentNegocio = { ...negocioData[0] };
          
          // DEMO PATCH: Force Justino (Tacos Don Tino) to be near Santa Fe
          if (currentNegocio.nombre.toLowerCase().includes("tino") || currentNegocio.nombre.toLowerCase().includes("justino")) {
            currentNegocio.latitud = 19.3615;
            currentNegocio.longitud = -99.2740;
            currentNegocio.direccion = "Av. Vasco de Quiroga 3800, Santa Fe (Puesto Muul)";
          }

          setNegocio(currentNegocio);

          // Fetch products for the real business
          const { data: productosData } = await supabase.rpc('get_productos_by_negocio_id', { p_negocio_id: currentNegocio.id });
          // Usa mockup si no hay productos en BD
          setProductos(productosData && productosData.length > 0 ? productosData : MOCKUP_PRODUCTOS);
        } else {
          // FALLBACK: Look in dummy data
          const foundDummy = dummyPois.find(p => p.id === id || slugify(p.nombre) === id);
          if (foundDummy) {
            const mapped: Negocio = {
              id: foundDummy.id,
              propietario_id: 'dummy',
              nombre: foundDummy.nombre,
              descripcion: foundDummy.descripcion,
              categoria: foundDummy.categoria as any,
              latitud: foundDummy.latitud,
              longitud: foundDummy.longitud,
              foto_url: foundDummy.foto_url,
              horario_apertura: foundDummy.horario_apertura,
              horario_cierre: foundDummy.horario_cierre,
              telefono: (foundDummy as any).telefono,
              instagram: (foundDummy as any).instagram,
              facebook: (foundDummy as any).facebook,
              verificado: true,
              activo: true,
              created_at: new Date().toISOString(),
            } as any;
            setNegocio(mapped);
            setProductos(foundDummy.productos as any || MOCKUP_PRODUCTOS);
          } else {
            setNotFound(true);
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user && negocioData && negocioData.length > 0 && user.id === negocioData[0].propietario_id) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Error:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, supabase, dummyPois]);

  // Separate effect for distance to avoid dependency hell
  useEffect(() => {
    if (!negocio || !negocio.latitud || !negocio.longitud) return;
    
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const d = haversine([pos.coords.latitude, pos.coords.longitude], [negocio.latitud!, negocio.longitud!]);
        setDistancia(d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`);
      });
    }
  }, [negocio]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim() || !negocio) return;
    setProdGuardando(true);
    setProdMsg("");

    const { error } = await supabase.rpc('add_new_producto', {
      p_negocio_id: negocio.id,
      p_nombre: prodNombre.trim(),
      p_descripcion: prodDescripcion.trim() || null,
      p_precio: prodPrecio ? parseFloat(prodPrecio) : null
    });

    if (error) {
      setProdMsg(tc("error"));
      console.error("Error adding product:", error);
    } else {
      const { data: productosData } = await supabase.rpc('get_productos_by_negocio_id', { p_negocio_id: negocio.id });
      if (productosData) setProductos(productosData);
      setProdNombre("");
      setProdDescripcion("");
      setProdPrecio("");
      setShowProductForm(false);
      setProdMsg(t("productoAgregado"));
      setTimeout(() => setProdMsg(""), 3000);
    }
    setProdGuardando(false);
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!negocio) return;
    await supabase.rpc('deactivate_producto', { p_producto_id: prodId });
    setProductos((prev) => prev.filter((p) => p.id !== prodId));
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface pt-24">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
          <p className="text-on-surface-variant font-medium tracking-widest uppercase text-xs">{t("cargando")}</p>
        </div>
      </main>
    );
  }

  if (notFound || !negocio) {
    return (
      <main className="max-w-screen-2xl mx-auto min-h-[60vh] flex flex-col items-center justify-center px-8 py-24 text-center space-y-6 pt-24">
        <span className="text-6xl">🏪</span>
        <h1 className="text-4xl font-serif font-semibold">{t("noEncontrado")}</h1>
        <p className="text-on-surface-variant max-w-md">{t("noEncontradoDesc")}</p>
        <Link href="/tiendas" className="px-8 py-3 bg-primary text-on-primary rounded-full font-sans font-bold hover:shadow-lg transition-all">{t("verTiendas")}</Link>
      </main>
    );
  }

  return (
    <main className="bg-surface pt-24 pb-20">
      {/* PROFILE HEADER */}
      <section className="max-w-screen-2xl mx-auto px-8 mb-12">
        {/* Hero Image */}
        <div className="relative h-96 w-full rounded-3xl overflow-hidden mb-8">
          {/* 
            📸 IMAGEN DE FONDO DEL NEGOCIO 
            
            Opciones para URL:
            1. negocio.foto_url (si existe en BD)
            2. Agregar columna: ALTER TABLE negocios ADD COLUMN foto_url TEXT;
            3. Supabase Storage: https://tu-bucket.supabase.co/storage/v1/object/public/...
            4. URL externa de CDN
            5. Fallback automático: getPremiumPhoto()
            
            Tamaño recomendado: 1200x400px o mayor
            Formato: JPG/PNG
          */}
          <img
            alt={negocio.nombre}
            className="w-full h-full object-cover"
            src={negocio.foto_url || getPremiumPhoto(negocio.nombre, negocio.categoria)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>

          {/* Logo y Nombre */}
          <div className="absolute bottom-8 left-8 flex items-end gap-6">
            <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-2xl">
              {/* 
                📸 LOGO DEL NEGOCIO 
                
                Opciones:
                1. Usar negocio.foto_url (mismo de arriba)
                2. Agregar columna logo_url: ALTER TABLE negocios ADD COLUMN logo_url TEXT;
                3. Avatar generado automáticamente (fallback actual)
                
                Tamaño recomendado: 256x256px (cuadrado)
                Formato: PNG con transparencia preferible
              */}
              <img
                alt="Business Logo"
                className="w-full h-full object-cover rounded-xl"
                src={negocio.foto_url || `https://ui-avatars.com/api/?name=${negocio.nombre}&background=003e6f&color=fff&size=256`}
              />
            </div>
            <div className="pb-2">
              <h1 className="text-5xl font-serif font-semibold text-white mb-2 tracking-tight">{negocio.nombre}</h1>
              {negocio.especialidades && negocio.especialidades.length > 0 && (
                <div className="flex gap-3">
                  {negocio.especialidades.slice(0, 2).map((spec) => (
                    <span key={spec} className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-mono font-bold tracking-widest uppercase">
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT GRID: Left (Main) + Right (Sidebar) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* LEFT: Description + Products */}
          <div className="md:col-span-2">
            {/* Descripción */}
            {negocio.descripcion && (
              <p className="text-xl font-serif text-on-surface/80 leading-relaxed mb-8">{negocio.descripcion}</p>
            )}

            {/* PRODUCTOS SECTION */}
            <div className="mb-16">
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-3xl font-serif font-medium">Productos Destacados</h2>
                {isOwner && (
                  <button
                    onClick={() => setShowProductForm(!showProductForm)}
                    className="text-primary font-sans font-bold text-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">{showProductForm ? "close" : "add"}</span>
                    {showProductForm ? "Cancelar" : "Agregar"}
                  </button>
                )}
              </div>

              {/* FORM PARA AGREGAR PRODUCTOS */}
              {isOwner && showProductForm && (
                <div className="bg-surface-container-low p-6 rounded-2xl mb-8 border border-outline-variant/10">
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input
                        type="text"
                        required
                        value={prodNombre}
                        onChange={(e) => setProdNombre(e.target.value)}
                        placeholder="Nombre del producto"
                        className="bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 text-on-surface text-sm"
                      />
                      <input
                        type="text"
                        value={prodDescripcion}
                        onChange={(e) => setProdDescripcion(e.target.value)}
                        placeholder="Descripción"
                        className="bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 text-on-surface text-sm"
                      />
                      <input
                        type="number"
                        value={prodPrecio}
                        onChange={(e) => setProdPrecio(e.target.value)}
                        placeholder="Precio"
                        step="0.01"
                        min="0"
                        className="bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 text-on-surface text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={prodGuardando}
                      className="bg-secondary text-on-secondary px-6 py-3 rounded-full font-sans font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {prodGuardando ? "Guardando..." : "Agregar Producto"}
                    </button>
                    {prodMsg && <p className="text-secondary text-xs font-bold">{prodMsg}</p>}
                  </form>
                </div>
              )}

              {/* PRODUCT GRID */}
              {productos.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12 space-y-4">
                  <span className="text-5xl">📦</span>
                  <p className="text-on-surface-variant">{t("sinProductos")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productos.map((p: Producto) => (
                    <div key={p.id} className="group cursor-pointer">
                      {/* 
                        📸 IMAGEN DE PRODUCTO 
                        
                        Opciones para URL:
                        1. producto.imagen_url (si existe en BD)
                        2. Agregar columna: ALTER TABLE productos ADD COLUMN imagen_url TEXT;
                        3. Supabase Storage con estructura: /productos/{producto-id}/imagen.jpg
                        4. URL externa de CDN
                        5. Fallback: Avatar generado (actual)
                        
                        Tamaño recomendado: 400x500px (proporción 4:5)
                        Formato: JPG/PNG
                        
                        Cambio del código:
                        src={p.imagen_url || `https://ui-avatars.com/api/?name=${p.nombre}...`}
                      */}
                      <div className="aspect-[4/5] bg-surface-container-low rounded-2xl overflow-hidden mb-4 transition-transform duration-300 group-hover:scale-[1.02] flex items-center justify-center">
                        <img
                          alt={p.nombre}
                          className="w-full h-full object-cover"
                          src={MOCKUP_IMAGEN_URLS[p.id] || `https://ui-avatars.com/api/?name=${p.nombre}&background=dde9ff&color=003e6f&size=400`}
                        />
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-sans font-bold text-on-surface">{p.nombre}</h3>
                          {p.descripcion && <p className="text-on-surface-variant text-sm">{p.descripcion}</p>}
                          {p.precio && <p className="font-mono text-sm text-primary font-bold">${p.precio}</p>}
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-error hover:text-error/80 transition-colors ml-2"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: SIDEBAR INFO */}
          <div className="space-y-8">
            {/* INFORMACIÓN PANEL */}
            <div className="bg-surface-container-low p-8 rounded-3xl">
              <h3 className="text-xl font-serif font-medium mb-6">Información</h3>
              <ul className="space-y-4">
                {negocio.direccion && (
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <span className="text-sm font-sans">{negocio.direccion}</span>
                  </li>
                )}
                {negocio.horario_apertura && negocio.horario_cierre && (
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <span className="text-sm font-sans">
                      {negocio.horario_apertura} - {negocio.horario_cierre}
                    </span>
                  </li>
                )}
                {distancia && (
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary">near_me</span>
                    <span className="text-sm font-sans">{distancia}</span>
                  </li>
                )}
              </ul>
              <button className="w-full mt-8 bg-gradient-to-br from-primary to-primary-container text-white font-sans font-bold py-4 rounded-full shadow-lg hover:brightness-105 transition-all">
                Reservar / Contactar
              </button>
            </div>

            {/* STATS PANEL */}
            <div className="bg-surface-container-low/50 p-8 rounded-3xl border border-outline-variant/10">
              <span className="px-2 py-1 bg-primary text-on-primary rounded-sm text-[10px] font-mono mb-4 inline-block">ESTADÍSTICAS</span>
              <h4 className="font-serif text-lg mb-2">Estado del Negocio</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Productos:</span>
                  <span className="font-bold text-primary">{productos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verificado:</span>
                  <span className="font-bold">{negocio.verificado ? "✅" : "⏳"}</span>
                </div>
              </div>
            </div>

            {/* REDES SOCIALES */}
            {(negocio.instagram || negocio.facebook) && (
              <div className="bg-surface-container-low p-8 rounded-3xl">
                <h4 className="font-serif text-lg mb-4">Contacto</h4>
                <div className="flex gap-4">
                  {negocio.instagram && (
                    <a
                      href={`https://instagram.com/${negocio.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-600 hover:bg-pink-500/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">camera_alt</span>
                    </a>
                  )}
                  {negocio.facebook && (
                    <a
                      href={`https://facebook.com/${negocio.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-700 hover:bg-blue-600/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">facebook</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
