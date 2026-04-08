"use client";

import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";
import { useTranslations, useLocale } from "next-intl";

interface UserInfo {
  initials: string;
  nombre: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const [user, setUser] = useState<UserInfo | null>(null);
  const t = useTranslations("nav");

  const idiomas = [
    { code: "es" as const, label: "ES", flag: "🇲🇽" },
    { code: "en" as const, label: "EN", flag: "🇺🇸" },
    { code: "zh" as const, label: "ZH", flag: "🇨🇳" },
    { code: "pt" as const, label: "PT", flag: "🇧🇷" },
  ];

  const navItems = useMemo(
    () => [
      { href: "/", label: t("explorar") },
      { href: "/tiendas", label: t("categorias") },
      { href: "/mapa", label: t("ofertas") },
    ],
    [t]
  );

  const cambiarIdioma = (newLocale: "es" | "en" | "zh" | "pt") => {
    router.push(pathname, { locale: newLocale });
  };

  const getCurrentLanguageLabel = () => {
    const lang = idiomas.find(i => i.code === locale);
    return lang?.label || "ES";
  };

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const perfil = await getPerfilCompat(supabase, authUser.id);
        const nombre = perfil?.nombre_completo || authUser.user_metadata?.nombre_completo || authUser.email || "Usuario";
        const parts = nombre.split(" ");
        const initials =
          parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
        setUser({ initials, nombre });
      } else {
        setUser(null);
      }
    };

    getUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
      <div className="max-w-[1440px] mx-auto h-[74px] px-8 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black text-primary italic tracking-tight leading-none whitespace-nowrap">
          MUUL
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex gap-12 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-headline text-lg font-medium tracking-tight transition-colors ${
                isActive(item.href)
                  ? "text-primary border-b-2 border-secondary-container pb-1"
                  : "text-slate-500 hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Search Bar - Desktop Only */}
        <div className="hidden lg:flex relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Buscar rutas o destinos..."
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
          <span className="material-symbols-outlined absolute right-3 top-2 text-slate-400 text-sm">search</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Cart */}
          <button className="text-primary hover:scale-110 transition-transform p-2 flex items-center justify-center text-2xl">
            🛒
          </button>

          {/* Language */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-primary hover:scale-110 transition-transform p-2">
              <span className="text-2xl">🌐</span>
              <span className="text-xs font-label font-bold">{getCurrentLanguageLabel()}</span>
            </button>
            <div className="absolute right-0 top-12 hidden group-hover:flex flex-col bg-white border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden z-40 min-w-max">
              {idiomas.map((idioma) => (
                <button
                  key={idioma.code}
                  onClick={() => cambiarIdioma(idioma.code)}
                  className={`px-4 py-2.5 hover:bg-surface-container-low text-xs font-label flex items-center gap-2 transition-colors border-b border-outline-variant/10 last:border-b-0 ${
                    locale === idioma.code ? "text-primary font-bold bg-surface-container-low" : "text-primary"
                  }`}
                >
                  <span>{idioma.flag}</span>
                  <span>{idioma.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Avatar or Login */}
          {user ? (
            <div className="relative group">
              <button className="w-10 h-10 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
                {user.initials}
              </button>
              <div className="absolute right-0 top-12 hidden group-hover:flex flex-col bg-white border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden z-40 min-w-max">
                <Link href="/perfil" className="px-4 py-2.5 hover:bg-surface-container-low text-sm text-primary font-medium transition-colors">
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 hover:bg-error/10 text-sm text-error font-medium text-left transition-colors border-t border-outline-variant/20"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 bg-primary text-white rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
