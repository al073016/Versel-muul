"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Negocio } from "@/types/database";

const categoryEmojis: Record<string, string> = {
  comida: "🌮",
  tienda: "🛍️",
  servicios: "🏨",
  cultural: "🏛️",
  deportes: "⚽",
};

export default function NegocioPerfilCompleto() {
  const supabase = createClient();
  const t = useTranslations("negocio");
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditor, setIsEditor] = useState(false);

  const [banner, setBanner] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [caracteristicas, setCaracteristicas] = useState({
    pago_tarjeta: false,
    transferencias: false,
    pet_friendly: false,
    vegana: false,
    accesibilidad: false,
  });

  useEffect(() => {
    const loadBusiness = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("negocios")
        .select("*")
        .eq("propietario_id", user.id)
        .eq("activo", true)
        .limit(1);

      if (data && data.length > 0) {
        const neg = data[0] as Negocio;
        setNegocio(neg);
        setBanner(neg.banner_url || "");
        setFotoPerfil(neg.foto_url || "");
        setInstagram(neg.instagram || "");
        setFacebook(neg.facebook || "");
        setCaracteristicas({
          pago_tarjeta: neg.caracteristicas?.pago_tarjeta ?? false,
          transferencias: neg.caracteristicas?.transferencias ?? false,
          pet_friendly: neg.caracteristicas?.pet_friendly ?? false,
          vegana: neg.caracteristicas?.vegana ?? false,
          accesibilidad: neg.caracteristicas?.accesibilidad ?? false,
        });
      }
      setLoading(false);
    };

    loadBusiness();
  }, [supabase]);

  const handleGuardar = async () => {
    if (!negocio) return;

    const { error } = await supabase
      .from("negocios")
      .update({
        banner_url: banner,
        foto_url: fotoPerfil,
        instagram,
        facebook,
        caracteristicas,
      })
      .eq("id", negocio.id);

    if (!error) {
      setIsEditor(false);
      setNegocio({
        ...negocio,
        banner_url: banner,
        foto_url: fotoPerfil,
        instagram,
        facebook,
        caracteristicas,
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );

  if (!negocio)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <span className="text-6xl">🏪</span>
        <p>No tienes un negocio registrado</p>
        <Link href="/tiendas" className="px-6 py-3 bg-primary text-white rounded-full">
          Registrar negocio
        </Link>
      </div>
    );

  return (
    <main className="min-h-screen pt-20 pb-12">
      {/* BANNER */}
      <div className="relative h-72 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {fotoPerfil && (
          <img src={fotoPerfil} alt={negocio.nombre} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        {isEditor && (
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            <input
              type="text"
              placeholder="URL del banner"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              className="px-4 py-2 rounded bg-white/90"
            />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Avatar */}
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl -mt-32 shrink-0 bg-surface-container-low">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt={negocio.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {categoryEmojis[negocio.categoria] || "🏪"}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-center gap-4">
            <h1 className="text-5xl font-bold">{negocio.nombre}</h1>
            <p className="text-on-surface-variant text-lg">{negocio.descripcion}</p>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-primary-container text-primary-fixed rounded-full text-sm font-bold">
                {negocio.categoria}
              </span>
              {negocio.verificado && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                  ✓ Verificado
                </span>
              )}
              <span className="text-gray-600">👥 {negocio.seguidores || 0} seguidores</span>
            </div>

            {isEditor ? (
              <button onClick={handleGuardar} className="w-fit px-6 py-3 bg-green-600 text-white rounded-full font-bold">
                Guardar cambios
              </button>
            ) : (
              <button onClick={() => setIsEditor(true)} className="w-fit px-6 py-3 bg-primary text-white rounded-full font-bold">
                Editar perfil
              </button>
            )}
          </div>
        </div>

        {/* Características */}
        <section className="bg-surface-container-low rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Características</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { key: "pago_tarjeta", label: "Pago con tarjeta", emoji: "💳" },
              { key: "transferencias", label: "Transferencias", emoji: "🏦" },
              { key: "pet_friendly", label: "Pet friendly", emoji: "🐶" },
              { key: "vegana", label: "Opciones veganas", emoji: "🥗" },
              { key: "accesibilidad", label: "Accesible", emoji: "♿" },
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() =>
                  isEditor &&
                  setCaracteristicas({
                    ...caracteristicas,
                    [key]: !caracteristicas[key as keyof typeof caracteristicas],
                  })
                }
                className={`p-4 rounded-2xl text-center transition-all ${
                  caracteristicas[key as keyof typeof caracteristicas]
                    ? "bg-secondary text-white shadow-lg"
                    : "bg-surface-container-high text-gray-600"
                }`}
              >
                <div className="text-3xl mb-2">{emoji}</div>
                <div className="text-xs font-bold">{label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Redes Sociales */}
        <section className="bg-surface-container-low rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Redes Sociales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={!isEditor}
                placeholder="@usuario"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Facebook</label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                disabled={!isEditor}
                placeholder="facebook.com/usuario"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant/20 bg-white"
              />
            </div>
          </div>
        </section>

        {/* Estadísticas Dummy */}
        <section className="grid grid-cols-3 gap-6">
          <div className="bg-primary/10 rounded-3xl p-6 text-center">
            <div className="text-3xl font-bold text-primary">245</div>
            <div className="text-sm text-gray-600">Visitas</div>
          </div>
          <div className="bg-secondary/10 rounded-3xl p-6 text-center">
            <div className="text-3xl font-bold text-secondary">18</div>
            <div className="text-sm text-gray-600">Productos</div>
          </div>
          <div className="bg-tertiary/10 rounded-3xl p-6 text-center">
            <div className="text-3xl font-bold text-tertiary">4.8</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
        </section>
      </div>
    </main>
  );
}
