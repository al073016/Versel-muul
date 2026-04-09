"use client";

import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";
import { useTranslations, useLocale } from "next-intl";
import { DUMMY_POIS } from "@/lib/dummy-data";

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

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "poi" | "person";
  lat?: number;
  lng?: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [negocio, setNegocio] = useState<BusinessInfo | null>(null);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("nav");

  // Search state
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const idiomas = [
    { code: "es" as const, label: "MX", flag: "https://flagcdn.com/w80/mx.png" },
    { code: "en" as const, label: "US", flag: "https://flagcdn.com/w80/us.png" },
    { code: "zh" as const, label: "CN", flag: "https://flagcdn.com/w80/cn.png" },
    { code: "pt" as const, label: "BR", flag: "https://flagcdn.com/w80/br.png" },
  ];

  const navItems = useMemo(
    () => [
      { href: "/", label: t("explorar") },
      { href: "/tiendas", label: t("categorias") },
      { href: "/mapa", label: t("mapa") },
      { href: "/amigos", label: t("amigos") },
      { href: "/ofertas", label: t("ofertas") },
    ],
    [t]
  );

  const cambiarIdioma = (newLocale: "es" | "en" | "zh" | "pt") => {
    setIsLanguageMenuOpen(false);
    router.push(pathname, { locale: newLocale, scroll: false });
  };

  const getCurrentLanguage = () => {
    return idiomas.find((i) => i.code === locale) || idiomas[0];
  };

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname?.startsWith(path));

  // Search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results: SearchResult[] = [];
        const isPersonSearch = searchQuery.startsWith("@");
        const searchTerm = isPersonSearch ? searchQuery.slice(1) : searchQuery;

        if (isPersonSearch) {
          const { data: users } = await supabase
            .from("perfiles")
            .select("id, nombre_completo")
            .ilike("nombre_completo", `%${searchTerm}%`)
            .limit(5);

          if (users) {
            users.forEach((u) =>
              results.push({
                id: u.id,
                title: u.nombre_completo || "Usuario",
                type: "person",
              })
            );
          }
        } else {
          const { data: dbPois } = await supabase
            .from("pois")
            .select("id, nombre, latitud, longitud, categoria")
            .ilike("nombre", `%${searchTerm}%`)
            .limit(5);

          if (dbPois) {
            dbPois.forEach((p) =>
              results.push({
                id: p.id,
                title: p.nombre,
                type: "poi",
                lat: p.latitud,
                lng: p.longitud,
                subtitle: p.categoria,
              })
            );
          }

          DUMMY_POIS.filter(
            (p) =>
              p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
          ).forEach((p) => {
            if (!results.find((r) => r.id === p.id)) {
              results.push({
                id: p.id,
                title: p.nombre,
                type: "poi",
                lat: p.latitud,
                lng: p.longitud,
                subtitle: p.categoria,
              });
            }
          });
        }

        setSearchResults(results);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === "person") {
      router.push(`/perfil?id=${result.id}`);
    } else {
      const url = `/mapa?poi=${result.id}&lat=${result.lat}&lng=${result.lng}&t=${Date.now()}`;
      router.push(url);
    }
    setSearchQuery("");
    setIsSearchVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchVisible || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectResult(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsSearchVisible(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchVisible(false);
      }
      if (!languageMenuRef.current?.contains(e.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLanguageMenuOpen(false);
        setIsSearchVisible(false);
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
        const nombre = perfil?.nombre_completo || authUser.user_metadata?.nombre_completo || authUser.email || "Usuario";
        const parts = nombre.split(" ");
        const initials =
          parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
        setUser({ initials, nombre, avatar_url: perfil?.avatar_url, userId: authUser.id });

        const { data: negocioData } = await supabase
          .from("negocios")
          .select("id, nombre")
          .eq("propietario_id", authUser.id)
          .eq("activo", true)
          .limit(1);

        if (negocioData && negocioData.length > 0) {
          setNegocio(negocioData[0] as BusinessInfo);
        } else {
          setNegocio(null);
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
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-[0_4px_20px_rgba(0,18,50,0.03)]">
      <div className="max-w-[1440px] mx-auto h-[80px] px-8 flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            className="text-3xl font-black text-[#003e6f] italic tracking-tighter leading-none hover:opacity-80 transition-opacity font-headline"
          >
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
                  ? "text-[#003e6f] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#fed000] after:rounded-full"
                  : "text-[#003e6f]/60 hover:text-[#003e6f]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Bar - Desktop Only */}
          <div className="hidden xl:flex relative w-64 group" ref={searchRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 0) setIsSearchVisible(true);
              }}
              onFocus={() => searchQuery.trim().length > 0 && setIsSearchVisible(true)}
              onKeyDown={handleKeyDown}
              placeholder={t("buscarPlaceholder")}
              className="w-full !bg-slate-100 border border-slate-200 rounded-full px-6 py-2.5 focus:bg-white focus:border-[#003e6f]/30 focus:ring-4 focus:ring-[#003e6f]/5 outline-none text-sm transition-all text-[#001c39] placeholder:text-[#003e6f]/60"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#003e6f]/40 text-lg group-focus-within:text-[#003e6f] transition-colors">
              search
            </span>

            {/* Results Dropdown */}
            {isSearchVisible && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-[0_20px_50px_rgba(0,18,50,0.12)] overflow-hidden z-[100] max-h-96 overflow-y-auto animate-fade-in">
                {isSearching && (
                  <div className="py-8 flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-[#003e6f]/20 border-t-[#003e6f] rounded-full animate-spin" />
                    <p className="text-xs text-[#003e6f]/40 font-bold">Buscando...</p>
                  </div>
                )}
                {!isSearching && searchResults.length === 0 && searchQuery.trim().length > 0 && (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs text-[#003e6f]/40 font-bold">Sin resultados</p>
                  </div>
                )}
                {!isSearching &&
                  searchResults.length > 0 &&
                  searchResults.map((result, idx) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all hover:bg-[#003e6f]/5 border-b border-neutral-100 last:border-b-0 ${
                        selectedIndex === idx ? "bg-[#003e6f]/5 border-l-4 border-[#fed000] pl-4" : ""
                      }`}
                    >
                      <span className="text-lg shrink-0">{result.type === "person" ? "👤" : "📍"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#003e6f] truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-[#003e6f]/60 capitalize">{result.subtitle}</p>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative" ref={languageMenuRef}>
            <button
              type="button"
              onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 text-[#003e6f] hover:bg-[#003e6f]/5 px-3 py-2 rounded-xl transition-all border border-neutral-100/50 bg-white/50 backdrop-blur-sm shadow-sm"
            >
              <div className="w-6 h-4 overflow-hidden rounded-[2px] border border-neutral-200 shadow-sm flex-shrink-0">
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
                className="absolute right-0 top-14 flex flex-col bg-white border border-neutral-200 rounded-2xl shadow-[0_20px_50px_rgba(0,18,50,0.12)] overflow-hidden z-[100] min-w-[180px] animate-fade-in"
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

          <div className="h-8 w-[1px] bg-neutral-200 hidden sm:block"></div>

          {/* Business Button */}
          {user && negocio && (
            <Link
              href="/negocio"
              className="flex items-center gap-2 px-4 py-2 bg-[#fed000]/10 border border-[#fed000]/20 rounded-full hover:bg-[#fed000]/20 transition-all group"
            >
              <span className="material-symbols-outlined text-[#fed000]">business</span>
              <span className="text-xs font-bold text-[#003e6f] max-w-[70px] truncate">{negocio.nombre}</span>
            </Link>
          )}

          {/* User Avatar or Login */}
          {user ? (
            <div className="relative group font-body">
              <Link
                href="/perfil"
                className="flex items-center gap-3 pl-2 pr-4 py-2 bg-[#003e6f]/5 border border-transparent rounded-full hover:bg-[#003e6f]/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#003e6f] to-[#005596] text-white text-[10px] font-black flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.initials
                  )}
                </div>
                <span className="text-xs font-bold text-[#003e6f] max-w-[80px] truncate">{user.nombre}</span>
              </Link>
              <div className="absolute right-0 top-14 hidden group-hover:flex flex-col bg-white border border-neutral-200 rounded-2xl shadow-[0_20px_50px_rgba(0,18,50,0.12)] overflow-hidden z-50 min-w-[200px] animate-fade-in">
                <Link
                  href="/perfil"
                  className="px-6 py-4 hover:bg-[#003e6f]/5 text-sm text-[#003e6f] font-bold transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">person</span>
                  {t("perfil")}
                </Link>
                <div className="h-[1px] bg-neutral-100 mx-4"></div>
                <button
                  onClick={handleLogout}
                  className="px-6 py-4 hover:bg-red-500/5 text-sm text-red-600 font-bold text-left transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  {t("salir")}
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-8 py-3 bg-[#003e6f] text-white rounded-full text-sm font-black uppercase tracking-tighter hover:bg-[#005596] hover:shadow-lg transition-all"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
