"use client";

import { Link } from "@/i18n/navigation";
import { Navbar, Footer, MobileNav } from "@/components/layout";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <>
      <Navbar />

      <main className="relative overflow-hidden bg-surface">
        {/* ===== HERO SECTION ===== */}
        <section className="relative w-full min-h-[85vh] overflow-hidden">
          {/* Hero Background Image Placeholder */}
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-end h-full min-h-[85vh] pb-16">
            <div className="max-w-2xl animate-fade-in-up">
              <p className="eyebrow text-white/70 mb-4">
                {t("badge")}
              </p>
              <h1 className="font-headline text-5xl md:text-7xl font-bold text-white leading-[1.05] mb-6">
                {t("titulo")}{" "}
                <em className="text-secondary-container">{t("tituloDestacado")}</em>
              </h1>
              <p className="text-white/80 text-lg md:text-xl font-body font-light mb-10 max-w-xl leading-relaxed">
                {t("subtitulo")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/mapa"
                  className="btn-pill inline-flex items-center gap-2 px-8 py-4 bg-white text-primary text-lg hover:shadow-float active:scale-95"
                >
                  {t("explorarMapa")}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href="/tiendas"
                  className="btn-pill inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white border border-white/20 text-lg hover:bg-white/20 active:scale-95"
                >
                  {t("registrarNegocio")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CATEGORIES — EXPLORA POR INTERÉS ===== */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="eyebrow mb-3">{t("badge")}</p>
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">
                {t("exploraInteresTitulo")}
              </h2>
            </div>
            <p className="text-on-surface-variant max-w-sm text-sm leading-relaxed font-body">
              {t("exploraInteresDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {/* Card: Refugios Locales / Comida */}
            <div className="group relative h-[400px] rounded-xl overflow-hidden cursor-pointer card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-tertiary to-tertiary/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-8">
                <p className="eyebrow text-white/60 mb-2">{t("tagHogarVerde")}</p>
                <h3 className="font-headline text-2xl md:text-3xl font-bold text-white">
                  {t("comida")}
                </h3>
                <p className="text-white/70 text-sm mt-2 font-body">{t("comidaDesc")}</p>
              </div>
            </div>

            {/* Card: Cultural */}
            <div className="group relative h-[400px] rounded-xl overflow-hidden cursor-pointer card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-8">
                <p className="eyebrow text-white/60 mb-2">{t("tagCulturaViva")}</p>
                <h3 className="font-headline text-2xl md:text-3xl font-bold text-white">
                  {t("cultural")}
                </h3>
                <p className="text-white/70 text-sm mt-2 font-body">{t("culturalDesc")}</p>
              </div>
            </div>

            {/* Card: Tiendas */}
            <div className="group relative h-[400px] rounded-xl overflow-hidden cursor-pointer card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B2014] to-[#C4392D]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-8">
                <p className="eyebrow text-white/60 mb-2">{t("tagGastronomia")}</p>
                <h3 className="font-headline text-2xl md:text-3xl font-bold text-white">
                  {t("tiendas")}
                </h3>
                <p className="text-white/70 text-sm mt-2 font-body">{t("tiendasDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== DESTINOS EN AUGE — Data Section ===== */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="eyebrow mb-3">{t("tendenciasTag")}</p>
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">
              {t("destinosTitulo")}
            </h2>
            <div className="w-12 h-1 bg-secondary-container mx-auto mt-4 rounded-full" />
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Large featured card */}
            <div className="md:col-span-5 relative h-[480px] rounded-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-label font-bold uppercase">{t("tendencia")}</span>
                  <span className="text-white/50 text-[10px] font-label uppercase">{t("subidaDato")}</span>
                </div>
                <h3 className="font-headline text-3xl md:text-4xl font-bold text-white mb-2">
                  {t("destinoPrincipal")}
                </h3>
                <div className="flex gap-6 text-white/70 text-sm font-label">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary-container text-sm">trending_up</span>
                    +124%
                  </span>
                  <span>24°C</span>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="md:col-span-7 grid grid-rows-2 gap-6">
              {/* Top row — destination card */}
              <div className="bg-surface-container-low rounded-xl p-8 flex items-center gap-6">
                <div className="flex-1">
                  <p className="eyebrow mb-1">{t("mexicoSur")}</p>
                  <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">{t("destinoSecundario")}</h3>
                  <p className="text-on-surface-variant text-sm font-body mb-3">{t("destinoSecundarioDesc")}</p>
                  <Link href="/mapa" className="inline-flex items-center gap-1 text-primary font-body font-bold text-sm hover:underline">
                    {t("explorarGuia")} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-3xl">surfing</span>
                </div>
              </div>

              {/* Bottom row — stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-secondary-container rounded-xl p-8 flex flex-col justify-end">
                  <span className="material-symbols-outlined text-primary mb-4">star</span>
                  <span className="font-headline text-4xl font-bold text-on-surface">8.4k</span>
                  <span className="text-on-surface-variant text-xs font-label uppercase tracking-widest mt-1">{t("recomendacionesDigitales")}</span>
                </div>
                <div className="bg-secondary-container rounded-xl p-8 flex flex-col justify-end">
                  <span className="material-symbols-outlined text-primary mb-4">eco</span>
                  <span className="font-headline text-4xl font-bold text-on-surface">92%</span>
                  <span className="text-on-surface-variant text-xs font-label uppercase tracking-widest mt-1">{t("impactoPositivo")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA — INTELIGENCIA EDITORIAL ===== */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-surface-container-low rounded-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Left content */}
            <div className="flex-1 p-12 md:p-16 flex flex-col justify-center">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface leading-tight mb-4">
                {t("uneteA")} <em className="text-primary">{t("inteligenciaEditorial")}</em>
              </h2>
              <p className="text-on-surface-variant font-body mb-8 max-w-md leading-relaxed">
                {t("newsletterDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="email"
                  placeholder={t("newsletterPlaceholder")}
                  className="flex-1 px-5 py-3 rounded-full bg-white text-on-surface text-sm font-body focus:ring-2 focus:ring-primary/20"
                />
                <button className="btn-pill px-6 py-3 bg-primary text-on-primary text-sm hover:shadow-glow-primary">
                  {t("suscribirme")}
                </button>
              </div>
            </div>

            {/* Right visual placeholder */}
            <div className="flex-1 min-h-[300px] bg-gradient-to-br from-primary/10 via-surface-container to-secondary-container/20 flex items-center justify-center">
              <div className="w-48 h-48 rounded-2xl bg-white/50 shadow-ambient flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-6xl">auto_stories</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </>
  );
}