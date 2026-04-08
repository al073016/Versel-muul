"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import type { Negocio } from "@/types/database";

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function NegocioDashboardPage() {
  const supabase = createClient();
  const t = useTranslations("negocio");
  const tNav = useTranslations("nav");
  const [loading, setLoading] = useState(true);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      const { data } = await supabase
        .from("negocios")
        .select("*")
        .eq("propietario_id", user.id)
        .eq("activo", true)
        .limit(1);

      if (data && data.length > 0) {
        setNegocio(data[0] as Negocio);
      }
      setLoading(false);
    };

    loadBusiness();
  }, [supabase]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto min-h-screen px-6 py-24">
        <div className="space-y-6 animate-pulse">
          <div className="h-12 bg-surface-container-high rounded-full w-1/3" />
          <div className="h-6 bg-surface-container-high rounded-full w-2/3" />
          <div className="h-[360px] bg-surface-container-high rounded-3xl" />
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="max-w-4xl mx-auto min-h-screen px-6 py-24 flex flex-col items-center justify-center text-center gap-6">
        <span className="text-6xl">🔐</span>
        <h1 className="text-4xl font-bold">Accede a tu panel de negocio</h1>
        <p className="text-on-surface-variant max-w-xl">
          Inicia sesión para ver si tienes un negocio registrado y administrarlo desde aquí.
        </p>
        <Link href="/login" className="px-8 py-4 bg-secondary text-on-secondary rounded-full font-bold">
          {tNav("login")}
        </Link>
      </main>
    );
  }

  if (!negocio) {
    return (
      <main className="max-w-4xl mx-auto min-h-screen px-6 py-24 flex flex-col items-center justify-center text-center gap-6">
        <span className="text-6xl">🏪</span>
        <h1 className="text-4xl font-bold">No tienes un negocio registrado</h1>
        <p className="text-on-surface-variant max-w-xl">
          Registra tu negocio en Muul para que turistas y visitantes puedan encontrar tus productos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/tiendas" className="px-8 py-4 bg-secondary text-on-secondary rounded-full font-bold">
            {t("verTiendas")}
          </Link>
          <Link href="/perfil" className="px-8 py-4 border border-outline-variant text-on-surface rounded-full font-bold">
            Ir a mi perfil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto min-h-screen px-6 py-24">
      <div className="bg-surface-container-low rounded-3xl p-10 shadow-xl border border-outline-variant/10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">{t("infoGeneral")}</span>
            <h1 className="text-5xl font-black">{negocio.nombre}</h1>
            <p className="text-on-surface-variant max-w-2xl">
              {negocio.descripcion || "Tu negocio está listo para recibir clientes en Muul."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/negocio/${negocio.id}`} className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-center">
              {t("gestionar")}
            </Link>
            <Link href="/tiendas" className="px-8 py-4 border border-outline-variant text-on-surface rounded-full font-bold text-center">
              {t("verTiendas")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-high rounded-3xl p-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">{t("categoria")}</p>
            <p className="text-lg font-bold">{negocio.categoria}</p>
          </div>
          <div className="bg-surface-container-high rounded-3xl p-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">{t("estadisticas")}</p>
            <p className="text-lg font-bold">{negocio.verificado ? t("verificado") : t("enRevision")}</p>
          </div>
          <div className="bg-surface-container-high rounded-3xl p-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Registrado</p>
            <p className="text-lg font-bold">{formatDate(negocio.created_at)}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
