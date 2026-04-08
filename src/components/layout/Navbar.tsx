"use client";

import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";
import { useTranslations, useLocale } from "next-intl";

interface UserInfo {
  initials: string;
  nombre: string;
  avatar_url?: string | null;
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
      { href: "/negocio", label: t("negocio") },
      { href: "/mapa", label: t("mapa") },
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

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname?.startsWith(path));

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
        setUser({ 
          initials, 
          nombre, 
          avatar_url: perfil?.avatar_url 
        });
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
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-2xl border-b border-outline-variant/10 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1440px] mx-auto h-[80px] px-8 flex items-center justify-between gap-8">
        {/* Logo Container */}
        <div className="flex items-center">
          <Link href="/" className="text-3xl font-black text-primary italic tracking-tighter leading-none hover:opacity-80 transition-opacity font-headline">
            MUUL
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex gap-10 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-headline text-base font-bold tracking-tight transition-all relative py-2 ${
                isActive(item.href)
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-secondary after:rounded-full"
                  : "text-slate-400 hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Search Bar - Desktop Only */}
          <div className="hidden xl:flex relative w-64 group">
            <input
              type="text"
              placeholder={t("buscarPlaceholder")}
              className="w-full bg-surface-container-low border border-transparent rounded-full px-6 py-2.5 focus:bg-white focus:border-secondary/30 focus:ring-4 focus:ring-secondary/10 outline-none text-sm transition-all"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-secondary transition-colors">search</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="relative group">
              <button className="flex items-center gap-2 text-primary hover:bg-surface-container-low px-4 py-2 rounded-full transition-all">
                <span className="text-xl">🌐</span>
                <span className="text-xs font-bold uppercase tracking-widest">{getCurrentLanguageLabel()}</span>
              </button>
              <div className="absolute right-0 top-14 hidden group-hover:flex flex-col bg-white border border-outline-variant/10 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[160px] animate-fade-in">
                {idiomas.map((idioma) => (
                  <button
                    key={idioma.code}
                    onClick={() => cambiarIdioma(idioma.code)}
                    className={`px-6 py-3.5 hover:bg-surface-container-low text-xs font-bold flex items-center justify-between transition-colors border-b border-outline-variant/5 last:border-b-0 ${
                      locale === idioma.code ? "text-primary bg-surface-container-low" : "text-primary/70"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>{idioma.flag}</span>
                      <span>{idioma.label}</span>
                    </span>
                    {locale === idioma.code && <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-outline-variant/20 hidden sm:block"></div>

          {/* User Avatar or Login */}
          {user ? (
            <div className="relative group font-body">
              <Link href="/perfil" className="flex items-center gap-3 pl-2 pr-4 py-2 bg-surface-container-low border border-outline-variant/5 rounded-full hover:bg-white hover:shadow-lg transition-all">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary-container text-white text-[10px] font-black flex items-center justify-center shadow-inner">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.initials
                  )}
                </div>
                <span className="text-xs font-bold text-primary max-w-[80px] truncate">{user.nombre}</span>
              </Link>
              <div className="absolute right-0 top-14 hidden group-hover:flex flex-col bg-white border border-outline-variant/10 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[200px] animate-fade-in">
                <Link href="/perfil" className="px-6 py-4 hover:bg-surface-container-low text-sm text-primary font-bold transition-colors flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">person</span>
                  Perfil
                </Link>
                <div className="h-[1px] bg-outline-variant/5 mx-4"></div>
                <button
                  onClick={handleLogout}
                  className="px-6 py-4 hover:bg-error/5 text-sm text-error font-bold text-left transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-8 py-3 bg-primary text-white rounded-full text-sm font-black uppercase tracking-tighter hover:brightness-110 hover:shadow-glow-primary transition-all shadow-xl shadow-primary/10"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
