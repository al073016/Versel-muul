import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full bg-white py-12 md:py-16 border-t border-outline-variant/10">
      <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
        {/* Left: Logo & Copyright */}
        <div className="text-center md:text-left">
          <p className="font-headline text-primary text-2xl md:text-3xl italic font-black leading-none">MUUL</p>
          <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.18em] mt-2">
            © 2024 MUUL por Coppel. Todos los derechos reservados.
          </p>
        </div>

        {/* Center: Links */}
        <div className="flex items-center gap-8 md:gap-12 text-xs uppercase tracking-widest text-on-surface-variant text-center md:text-left">
          <Link href="#" className="font-label hover:text-primary transition-colors font-bold">
            {t("privacidad")}
          </Link>
          <Link href="#" className="font-label hover:text-primary transition-colors font-bold">
            {t("soporte")}
          </Link>
          <Link href="#" className="font-label hover:text-primary transition-colors font-bold">
            {t("fifa")}
          </Link>
        </div>

        {/* Right: Social Icons */}
        <div className="flex gap-3">
          <a href="#" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-colors">
            <span className="material-symbols-outlined text-base">share</span>
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-colors">
            <span className="material-symbols-outlined text-base">public</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
