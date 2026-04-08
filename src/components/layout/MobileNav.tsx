"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tm = useTranslations("mobileNav");

  const navItems = [
    { href: "/", emoji: "🔍", label: t("explorar") },
    { href: "/mapa", emoji: "🗺️", label: t("mapa") },
    { href: "/perfil", emoji: "👤", label: t("perfil") },
    { href: "#tickets", emoji: "🎫", label: tm("tickets") },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low/80 backdrop-blur-lg px-6 py-4 flex justify-between items-center z-50 border-t border-outline-variant/10">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.emoji} href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}