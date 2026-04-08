import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full bg-neutral-950">
      <div className="max-w-[1440px] mx-auto px-8 md:px-16">

        {/* Top: Branding Row — logos distribuidos a lo largo */}
        <div className="flex flex-wrap items-center justify-between gap-8 py-14 border-b border-white/10">
          {/* Fundación Coppel */}
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="w-14 h-14 flex items-center justify-center bg-white/10 rounded-2xl group-hover:bg-white/15 transition-colors">
              <span className="material-symbols-outlined text-white text-3xl">volunteer_activism</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest !text-[#fed000] uppercase leading-none font-label">Fundación</span>
              <span className="text-2xl font-black tracking-tighter text-white leading-tight font-body">Coppel</span>
            </div>
          </div>

          {/* Divider vertical */}
          <div className="hidden md:block w-px h-10 bg-white/10" />

          {/* Coppel Emprende */}
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="w-14 h-14 bg-[#fed000] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-neutral-900 text-2xl">rocket_launch</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white leading-tight font-body">Coppel</span>
              <span className="text-[10px] font-black tracking-widest !text-[#fed000] uppercase leading-none font-label">Emprende</span>
            </div>
          </div>

          {/* Divider vertical */}
          <div className="hidden md:block w-px h-10 bg-white/10" />

          {/* Ola Mexico */}
          <div className="bg-[#00843d] px-10 py-5 rounded-2xl flex flex-col items-center justify-center cursor-pointer shadow-xl hover:scale-105 transition-transform duration-300">
            <span className="text-white font-black text-4xl leading-none tracking-[-0.05em]">OLA</span>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex flex-col gap-[3px]">
                <div className="w-7 h-[2px] bg-white/70 rounded-full"></div>
                <div className="w-9 h-[3px] bg-white rounded-full"></div>
                <div className="w-5 h-[2px] bg-white/50 rounded-full"></div>
              </div>
              <span className="text-white font-black text-xs tracking-[0.25em]">MEXICO</span>
            </div>
          </div>
        </div>

        {/* Bottom: Info & Socials */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 py-10">
          {/* Brand + Copyright */}
          <div className="text-center md:text-left">
            <p className="font-headline !text-white text-4xl italic font-black leading-none tracking-tight drop-shadow-[0_0_22px_rgba(255,255,255,0.22)]">MUUL</p>
            <p className="font-label !text-white/90 text-[11px] uppercase tracking-[0.15em] mt-3">
              © 2026 MUUL por Coppel. Todos los derechos reservados.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-10 text-[12px] uppercase tracking-widest text-white/95">
            <Link href="#" className="font-label !text-white hover:!text-white transition-colors font-bold">{t("privacidad")}</Link>
            <Link href="#" className="font-label !text-white hover:!text-white transition-colors font-bold">{t("soporte")}</Link>
          </div>

          {/* Social Icons */}
          <div className="flex gap-3">
            <a href="#" className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/15 transition-all">
              <span className="material-symbols-outlined text-[18px]">share</span>
            </a>
            <a href="#" className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/15 transition-all">
              <span className="material-symbols-outlined text-[18px]">public</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
