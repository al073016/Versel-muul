"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { User, MapPin, Route, Star } from "lucide-react";

type TabSetter = (tab: "cuenta" | "direcciones" | "rutas" | "resenas" | "ajustes" | "editar") => void;

interface PerfilMobileNavProps {
  activeTab: string;
  setActiveTab: TabSetter;
}

export default function PerfilMobileNav({ activeTab, setActiveTab }: PerfilMobileNavProps) {
  const t = useTranslations("perfil");

  const navItems = [
    { id: "cuenta", icon: <User size={24} />, label: "Cuenta" },
    { id: "direcciones", icon: <MapPin size={24} />, label: "Direcciones" },
    { id: "rutas", icon: <Route size={24} />, label: "Rutas" },
    { id: "resenas", icon: <Star size={24} />, label: "Reseñas" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant/10 bg-surface-container-low/95 backdrop-blur-md px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 gap-2">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center transition-colors ${
                active
                  ? "bg-[#003e6f]/10 text-[#003e6f]"
                  : "text-on-surface-variant hover:bg-white/70 hover:text-on-surface"
              }`}
            >
              <div className="text-lg leading-none">{item.icon}</div>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
