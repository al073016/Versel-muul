"use client";

import Image from "next/image";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";
import { useTranslations, useLocale } from "next-intl";

interface UserInfo {
  initials: string;
  nombre: string;
  avatar_url?: string | null;
  userId: string;
}

interface BusinessInfo {
  id: string;
  nombre: string;
}

export default function NavbarNegocio() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [negocio, setNegocio] = useState<BusinessInfo | null>(null);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("nav");

  const idiomas = [
    { code: "es" as const, label: "MX", flag: "https://flagcdn.com/w80/mx.png" },
    { code: "en" as const, label: "US", flag: "https://flagcdn.com/w80/us.png" },
    { code: "zh" as const, label: "CN", flag: "https://flagcdn.com/w80/cn.png" },
    { code: "pt" as const, label: "BR", flag: "https://flagcdn.com/w80/br.png" },
  ];

  const getBusinessNavItems = () => [
    { href: "/", label: "Principal" },
    { href: "/comunidad", label: "Comunidad" },
    { href: "/recursos", label: "Recursos" },
    { href: negocio ? `/negocio/${negocio.id}` : "#", label: "Mi Negocio" },
  ];

  const cambiarIdioma = (newLocale: "es" | "en" | "zh" | "pt") => {
    setIsLanguageMenuOpen(false);
    router.push(pathname, { locale: newLocale, scroll: false });
  };

  const getCurrentLanguage = () => {
    return idiomas.find((i) => i.code === locale) || idiomas[0];
  };

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname?.startsWith(path));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!languageMenuRef.current?.contains(e.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (!profileMenuRef.current?.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const perfil = await getPerfilCompat(supabase, authUser.id);
        const nombre = perfil?.nombre_completo || authUser.user_metadata?.nombre_completo || authUser.email || t("person");
        const parts = nombre.split(" ");
        const initials =
          parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
        setUser({ initials, nombre, avatar_url: perfil?.avatar_url, userId: authUser.id });

        // Use RPC to get business data (respects RLS)
        const { data: negocioData, error } = await supabase.rpc("get_negocio_usuario_actual");

        if (error || !negocioData || negocioData.length === 0) {
          console.error("Error fetching negocio:", error);
          setNegocio(null);
        } else {
          setNegocio(negocioData[0] as BusinessInfo);
        }
      } else {
        setUser(null);
        setNegocio(null);
      }
    };
    getUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });
    return () => subscription.unsubscribe();
  }, [supabase, t]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-[#003e6f] to-[#005596] border-b border-[#003e6f]/20 shadow-[0_4px_30px_rgba(0,62,111,0.15)]">
      <div className="max-w-[1440px] mx-auto h-[80px] px-8 flex items-center justify-between gap-8">
        {/* Logo & Business Name */}
        <div className="flex items-center gap-4">
          <Image
            src="https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/logoblanco.png"
            alt="MUUL Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <div className="flex flex-col">
            <Link
              href="/"
              className="text-2xl font-black text-white italic tracking-tighter leading-none hover:opacity-90 transition-opacity font-headline"
            >
              MUUL
            </Link>
            {negocio && (
              <p className="text-xs font-bold text-[#fed000] tracking-wide uppercase">{negocio.nombre}</p>
            )}
          </div>
        </div>

        {/* Business Desktop Nav */}
        <div className="hidden lg:flex gap-8 items-center">
          {getBusinessNavItems().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-headline text-sm font-bold tracking-tight transition-all relative py-2 ${
                isActive(item.href)
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#fed000] after:rounded-full"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative" ref={languageMenuRef}>
            <button
              type="button"
              onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all border border-white/20 bg-white/5 backdrop-blur-sm"
            >
              <div className="w-6 h-4 overflow-hidden rounded-[2px] border border-white/30 flex-shrink-0">
                <img 
                  src={getCurrentLanguage().flag} 
                  alt={getCurrentLanguage().label} 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">{getCurrentLanguage().label}</span>
            </button>

            {isLanguageMenuOpen && (
              <div
                className="absolute right-0 top-14 flex flex-col bg-white border border-neutral-200 rounded-2xl shadow-[0_20px_50px_rgba(0,18,50,0.15)] overflow-hidden z-[100] min-w-[180px] animate-fade-in"
                role="menu"
              >
                {idiomas.map((idioma) => (
                  <button
                    key={idioma.code}
                    type="button"
                    onClick={() => cambiarIdioma(idioma.code)}
                    className={`px-6 py-4 hover:bg-[#003e6f]/5 text-xs font-bold flex items-center justify-between transition-colors border-b border-neutral-100 last:border-b-0 ${
                      locale === idioma.code ? "text-[#003e6f] bg-[#003e6f]/5" : "text-[#003e6f]/70"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-6 h-4 overflow-hidden rounded-[2px] border border-neutral-200">
                        <img src={idioma.flag} alt={idioma.label} className="w-full h-full object-cover" />
                      </div>
                      <span>{idioma.label}</span>
                    </span>
                    {locale === idioma.code && <span className="w-1.5 h-1.5 bg-[#fed000] rounded-full"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-white/20 hidden sm:block"></div>

          {/* User Avatar or Login */}
          {user ? (
            <div className="relative font-body" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-2 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#fed000] text-[#003e6f] text-[10px] font-black flex items-center justify-center border-2 border-white/30">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.initials
                  )}
                </div>
                <span className="text-xs font-bold text-white max-w-[80px] truncate">{user.nombre}</span>
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-14 flex flex-col bg-white border border-neutral-200 rounded-2xl shadow-[0_20px_50px_rgba(0,18,50,0.15)] overflow-hidden z-[100] min-w-[220px] animate-fade-in">
                  {negocio && (
                    <>
                      <Link
                        href={`/negocio/${negocio.id}`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="px-6 py-4 hover:bg-[#003e6f]/5 text-sm text-[#003e6f] font-bold transition-colors flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-lg">storefront</span>
                        Mi Negocio
                      </Link>
                      <Link
                        href={`/negocio/${negocio.id}/perfil`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="px-6 py-4 hover:bg-[#003e6f]/5 text-sm text-[#003e6f] font-bold transition-colors flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-lg">business</span>
                        Perfil del Negocio
                      </Link>
                      <div className="h-[1px] bg-neutral-100"></div>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="px-6 py-4 hover:bg-red-500/5 text-sm text-red-600 font-bold text-left transition-colors flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Salir
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-8 py-3 bg-[#fed000] text-[#003e6f] rounded-full text-sm font-black uppercase tracking-tighter hover:bg-white hover:shadow-lg transition-all"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
