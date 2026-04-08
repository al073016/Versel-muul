"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="pt-20 bg-white">
      {/* Hero Section - Premium Background */}
      <section className="relative h-[600px] md:h-[800px] w-full overflow-hidden bg-black">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?q=80&w=1920&auto=format&fit=crop")',
          }}
        />
        
        {/* Gradient Overlay - Subtle for text readability */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)'}} />
        
        {/* Content */}
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col justify-center items-start">
          {/* Label */}
          <div className="inline-flex items-center gap-2 mb-8 font-label text-xs uppercase tracking-[0.2em]" style={{color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9)'}}>
            <span className="w-2 h-2 rounded-full bg-[#fed000]"></span>
            {t("badge")}
          </div>
          
          {/* Main Headline */}
          <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl max-w-5xl leading-[1.1] mb-6 md:mb-8 font-black tracking-tight" style={{color: '#FFFFFF', textShadow: '0 0 50px rgba(0,0,0,1), 3px 3px 12px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)'}}>
            {t("titulo")} <br className="hidden md:block" /><span className="italic font-light" style={{color: '#FFFFFF'}}>{t("tituloDestacado")}</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl max-w-2xl mb-10 md:mb-12 font-body leading-relaxed" style={{color: '#FFFFFF', textShadow: '0 0 30px rgba(0,0,0,1), 2px 2px 8px rgba(0,0,0,0.9)'}}>
            {t("subtitulo")}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/mapa"
              className="bg-[#003e6f] text-white !text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-headline font-black text-base md:text-lg hover:bg-[#005596] transition-all shadow-2xl shadow-[#003e6f]/20 flex items-center justify-center gap-2 group"
            >
              {t("explorarMapa")} 
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <button className="bg-white/20 backdrop-blur-md border-2 border-white/60 text-white !text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-headline font-black text-base md:text-lg hover:bg-white/30 hover:border-white/80 transition-all shadow-lg">
              {t("verCatalogo")}
            </button>
          </div>
        </div>
      </section>

      {/* Category Cards - Explore by Interest */}
      <section className="py-24 md:py-32 bg-white px-6 md:px-12 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
          <div>
            <span className="font-label text-[#005596] tracking-widest text-xs uppercase mb-4 block font-black">✨ {t("explorar")}</span>
            <h2 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black">{t("exploraInteresTitulo")}</h2>
          </div>
          <p className="text-neutral-500 max-w-sm font-body text-lg leading-relaxed">
            {t("exploraInteresDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {/* Nature Card */}
          <div className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%), url("https://images.unsplash.com/photo-1518101645466-7795885ff8f8?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <span className="font-label text-emerald-300 !text-emerald-300 text-xs uppercase tracking-widest mb-3 block font-bold">{t("tagHogarVerde")}</span>
              <h3 className="font-headline text-4xl md:text-5xl text-white !text-white font-black">{t("explorar")} {t("comida")}</h3>
              <div className="h-1.5 w-12 bg-[#fed000] mt-6 rounded-full group-hover:w-20 transition-all duration-300" />
            </div>
          </div>
          
          {/* Culture Card */}
          <div className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1518101645466-7795885ff8f8?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <span className="font-label text-cyan-300 !text-cyan-300 text-xs uppercase tracking-widest mb-3 block font-bold">{t("tagCulturaViva")}</span>
              <h3 className="font-headline text-4xl md:text-5xl text-white !text-white font-black">{t("cultural")}</h3>
              <div className="h-1.5 w-12 bg-[#fed000] mt-6 rounded-full group-hover:w-20 transition-all duration-300" />
            </div>
          </div>
          
          {/* Gastronomy Card */}
          <div className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <span className="font-label text-orange-300 !text-orange-300 text-xs uppercase tracking-widest mb-3 block font-bold">{t("tagGastronomia")}</span>
              <h3 className="font-headline text-4xl md:text-5xl text-white !text-white font-black">{t("comida")}</h3>
              <div className="h-1.5 w-12 bg-[#fed000] mt-6 rounded-full group-hover:w-20 transition-all duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Destinations - Light Theme Refined */}
      <section className="py-24 md:py-32 bg-[#f3f6ff]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="flex flex-col items-center text-center mb-20">
            <span className="font-label text-[#005596] tracking-widest text-xs uppercase mb-4 font-black">📊 {t("tendenciasTag")}</span>
            <h2 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black mb-6">{t("destinosTitulo")}</h2>
            <div className="w-24 h-1.5 bg-[#fed000] rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-8 h-auto md:h-[700px]">
            {/* Main Featured Card */}
            <div className="md:col-span-2 md:row-span-2 relative rounded-[3rem] overflow-hidden shadow-2xl hover:shadow-[0_30px_60px_rgba(0,62,111,0.15)] transition-all duration-500 group cursor-pointer h-80 md:h-full border border-white/20">
               <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1512813588641-0737a3459ced?q=80&w=800&auto=format&fit=crop")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-10">
                <div className="inline-flex items-center gap-3 mb-6 w-fit bg-[#fed000] px-5 py-2 rounded-xl shadow-lg">
                  <span className="text-[#003e6f] text-xs font-headline font-black uppercase tracking-widest">🔥 Trending #1</span>
                </div>
                <h3 className="font-headline text-5xl md:text-6xl text-white font-black mb-6 leading-tight !text-white text-shadow-lg">Centro Histórico</h3>
                <div className="flex gap-8">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl">
                    <span className="text-white/60 !text-white/60 text-xs uppercase block font-label mb-1">{t("tendencia")}</span>
                    <span className="text-white !text-white font-headline text-3xl font-black">+124%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Puerto Escondido */}
            <div className="md:col-span-2 relative rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group cursor-pointer h-80 md:h-auto">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,62,111,0.2), rgba(0,28,57,0.4)), url("https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?q=80&w=800&auto=format&fit=crop")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/80 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-10">
                <span className="text-cyan-300 !text-cyan-300 font-label text-xs uppercase tracking-widest mb-3 font-bold">REFORMA</span>
                <h3 className="font-headline text-3xl md:text-4xl text-white font-black mb-4 !text-white">Paseo de la Reforma</h3>
                <button className="bg-white text-[#003e6f] font-headline font-black text-sm flex items-center gap-2 px-6 py-3 rounded-full w-fit hover:bg-[#fed000] transition-all">
                  {t("explorarGuia")} 
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Custom Stats Cards - More Premium Light Style */}
            <div className="bg-[#003e6f] rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-xl transition-all hover:-translate-y-2 border border-white/10">
              <span className="material-symbols-outlined text-5xl opacity-50">insights</span>
              <div>
                <span className="font-headline text-5xl font-black block leading-none text-white !text-white">8.4k</span>
                <p className="font-label text-xs uppercase tracking-widest mt-4 font-bold text-white/70">{t("recomendacionesDigitales")}</p>
              </div>
            </div>

            <div className="bg-[#fed000] rounded-[3rem] p-10 text-[#003e6f] flex flex-col justify-between shadow-xl transition-all hover:-translate-y-2 border border-[#003e6f]/5">
              <span className="material-symbols-outlined text-5xl opacity-40">hotel</span>
              <div>
                <span className="font-headline text-5xl font-black block leading-none text-[#003e6f]">92%</span>
                <p className="font-label text-xs uppercase tracking-widest mt-4 font-bold text-[#003e6f]/60">{t("impactoPositivo")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter - Premium Gradient */}
      <section className="py-24 md:py-32 bg-white px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto bg-gradient-to-br from-[#003e6f] via-[#005596] to-[#001c39] rounded-[4rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-[100px] -z-10" />
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-8 text-white !text-white font-label text-xs uppercase tracking-[0.2em] bg-white/10 px-5 py-2.5 rounded-full border border-white/20 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#fed000] animate-pulse"></span>
                {t("badge")}
              </div>
              
              <h2 className="font-headline text-5xl md:text-7xl text-white !text-white mb-8 font-black leading-[1.1]">
                {t("uneteA")} <br /><span className="text-[#fed000] !text-[#fed000] italic font-light">{t("inteligenciaEditorial")}</span>
              </h2>
              
              <p className="text-white/80 text-lg md:text-xl mb-12 font-body leading-relaxed max-w-lg">
                {t("newsletterDesc")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                <input 
                  type="email" 
                  placeholder={t("newsletterPlaceholder")}
                  className="flex-1 px-8 py-5 bg-white/10 border border-white/20 backdrop-blur-xl rounded-full text-white !text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#fed000] transition-all font-body font-medium shadow-inner"/>
                <button className="px-10 py-5 bg-[#fed000] text-[#003e6f] border border-white/20 rounded-full font-headline font-black text-base hover:bg-white transition-all shadow-xl whitespace-nowrap">
                  {t("suscribirme")}
                </button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-3xl">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop" 
                  alt="Newsletter" 
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-24"></div>
    </main>
  );
}
