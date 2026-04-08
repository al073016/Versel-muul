import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full py-12 bg-surface-container-lowest border-t border-outline-variant/5">
      <div className="flex flex-col items-center justify-center text-center space-y-6 w-full px-4">
        {/* Brand */}
        <span className="text-sm font-bold text-on-surface font-headline uppercase tracking-[0.2em]">
          Muul
        </span>

        {/* Links */}
        <div className="flex gap-8">
          <Link
            href="#"
            className="text-on-surface-variant hover:text-on-surface text-xs uppercase tracking-widest transition-opacity opacity-80 hover:opacity-100"
          >
            {t("privacidad")}
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant hover:text-on-surface text-xs uppercase tracking-widest transition-opacity opacity-80 hover:opacity-100"
          >
            {t("soporte")}
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant hover:text-on-surface text-xs uppercase tracking-widest transition-opacity opacity-80 hover:opacity-100"
          >
            {t("fifa")}
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-on-surface-variant text-xs uppercase tracking-widest">
          {t("copyright")}
        </p>

        {/* Icons */}
        <div className="pt-4 flex gap-4 text-on-surface-variant/40">
          <span className="material-symbols-outlined text-sm">public</span>
          <span className="material-symbols-outlined text-sm">share</span>
          <span className="material-symbols-outlined text-sm">stadium</span>
        </div>
      </div>
    </footer>
  );
}