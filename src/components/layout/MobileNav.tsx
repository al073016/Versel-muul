"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";

export default function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/", emoji: "🔍", label: t("explorar") },
    { href: "/tiendas", emoji: "🏪", label: t("categorias") },
    { href: "/mapa", emoji: "🗺️", label: t("mapa") },
    { href: "/amigos", emoji: "👥", label: t("amigos") },
    { href: "/ofertas", emoji: "🏷️", label: t("ofertas") },
    { href: "/perfil", emoji: "👤", label: t("perfil") },
  ];

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "MUUL",
          text: tf("shareText"),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Intentionally ignored.
    }
    setIsMoreOpen(false);
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  if (pathname?.includes("/mapa") || pathname?.includes("/perfil")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/10 bg-surface-container-low/95 backdrop-blur-md px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center transition-colors ${
                active
                  ? "bg-[#003e6f]/10 text-[#003e6f]"
                  : "text-on-surface-variant hover:bg-white/70 hover:text-on-surface"
              }`}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setIsMoreOpen((value) => !value)}
            className={`flex min-h-[3.5rem] w-full flex-col items-center justify-center rounded-2xl px-2 py-2 text-center transition-colors ${
              isMoreOpen
                ? "bg-[#fed000]/20 text-[#003e6f]"
                : "text-on-surface-variant hover:bg-white/70 hover:text-on-surface"
            }`}
          >
            <span className="text-lg leading-none">⋯</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] leading-tight">
              {t("more")}
            </span>
          </button>

          {isMoreOpen && (
            <div className="absolute bottom-full right-0 mb-3 w-[min(280px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_20px_50px_rgba(0,18,50,0.16)]">
              <Link
                href="/privacidad"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-sm font-bold text-[#003e6f] transition-colors hover:bg-[#003e6f]/5"
              >
                <span className="text-base">🔒</span>
                {tf("privacidad")}
              </Link>
              <Link
                href="/soporte"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 text-sm font-bold text-[#003e6f] transition-colors hover:bg-[#003e6f]/5"
              >
                <span className="text-base">💬</span>
                {tf("soporte")}
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center gap-3 border-t border-neutral-100 px-5 py-4 text-sm font-bold text-[#003e6f] transition-colors hover:bg-[#003e6f]/5"
              >
                <span className="text-base">🔗</span>
                {tf("compartir")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}