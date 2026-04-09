"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function Footer() {
  const t = useTranslations("footer");
  const [shareFeedback, setShareFeedback] = useState("");

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "MUUL",
          text: t("shareText"),
          url: shareUrl,
        });
        setShareFeedback(t("shared"));
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback(t("copied"));
      }
    } catch {
      setShareFeedback(t("shareError"));
    }

    setTimeout(() => setShareFeedback(""), 2500);
  };

  return (
    <footer className="w-full bg-neutral-950 pb-24 md:pb-0 relative z-40">
      <div className="max-w-[1440px] mx-auto px-8 md:px-16">

        {/* Top: Branding Row — logos distribuidos a lo largo */}
        <div className="flex flex-wrap items-center justify-between gap-8 py-14 border-b border-white/10">
          {/* Fundación Coppel */}
          <a href="https://www.fundacioncoppel.org" target="_blank" rel="noopener noreferrer" className="cursor-pointer group">
            <Image
              src="https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/Fundacion%20Coppel-WhiteYellow@4x.png"
              alt="Fundación Coppel"
              width={180}
              height={80}
              className="h-8 w-auto object-contain group-hover:opacity-80 transition-opacity"
            />
          </a>

          {/* Divider vertical */}
          <div className="hidden md:block w-px h-10 bg-white/10" />

          {/* Coppel Emprende */}
          <a href="https://www.fundacioncoppel.org/coppel-emprende/" target="_blank" rel="noopener noreferrer" className="cursor-pointer group">
            <Image
              src="https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/Coppel%20Emprende%20_RGB_Secundario_White.png"
              alt="Coppel Emprende"
              width={180}
              height={80}
              className="h-16 w-auto object-contain group-hover:opacity-80 transition-opacity"
            />
          </a>

          {/* Divider vertical */}
          <div className="hidden md:block w-px h-10 bg-white/10" />

          {/* Ola Mexico */}
          <a href="https://olamexico.org" target="_blank" rel="noopener noreferrer" className="cursor-pointer group">
            <Image
              src="https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/olaMexicoLogo.jpeg"
              alt="OLA México"
              width={180}
              height={80}
              className="h-16 w-auto object-contain group-hover:opacity-80 transition-opacity"
            />
          </a>
        </div>

        {/* Bottom: Info & Socials */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 py-10">
          {/* Brand + Copyright */}
          <div className="text-center md:text-left">
            <p className="font-headline !text-white text-4xl italic font-black leading-none tracking-tight drop-shadow-[0_0_22px_rgba(255,255,255,0.22)]">MUUL</p>
            <p className="font-label !text-white/90 text-[11px] uppercase tracking-[0.15em] mt-3">
              {t("copyright")}
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-10 text-[12px] uppercase tracking-widest text-white/95">
            <Link href="/privacidad" className="font-label !text-white hover:!text-white transition-colors font-bold">{t("privacidad")}</Link>
            <Link href="/soporte" className="font-label !text-white hover:!text-white transition-colors font-bold">{t("soporte")}</Link>
          </div>

          {/* Social Icons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/15 transition-all"
              aria-label={t("compartir")}
              title={t("compartir")}
            >
              <span className="text-[18px]">🔗</span>
            </button>
            {shareFeedback && (
              <span className="self-center text-[11px] font-label !text-white/90 uppercase tracking-wider">{shareFeedback}</span>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
