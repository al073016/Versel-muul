"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { haversine } from "@/lib/haversine";

const OFFERS_DATA = [
  { id: 1, name: "Tacos El Guero", lat: 19.423, lng: -99.163, desc: "20% de descuento en todos los tacos al pastor. Solo con código MUUL26.", off: "-20% OFF", type: "food" },
  { id: 2, name: "Coppel Reforma", lat: 19.428, lng: -99.157, desc: "Bono de $500 MXN en compras mayores a $3,000 en tecnología.", off: "$500 MXN", type: "tech" },
  { id: 3, name: "Soumaya VIP", lat: 19.440, lng: -99.204, desc: "Pase premium 2x1 en visitas guiadas nocturnas. Cupos limitados.", off: "2x1", type: "culture" }
];

export default function HomePage() {
  const t = useTranslations("home");

  const [activeHero, setActiveHero] = useState(0);
  const [distancias, setDistancias] = useState<Record<number, string>>({});
  const heroImages = [
    "https://images.unsplash.com/photo-1518182170546-07661fd94144?q=80&w=1920&auto=format&fit=crop", // Ángel de la Independencia
    "https://images.unsplash.com/photo-1585464231473-746d24c039a2?q=80&w=1920&auto=format&fit=crop", // Bellas Artes
    "https://images.unsplash.com/photo-1563911892437-1feda0179e1b?q=80&w=1920&auto=format&fit=crop"  // Chapultepec
  ];

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        const newDist: Record<number, string> = {};
        OFFERS_DATA.forEach(off => {
          const d = haversine([uLat, uLng], [off.lat, off.lng]);
          newDist[off.id] = d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
        });
        setDistancias(newDist);
      });
    }

    const timer = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <main className="pt-20 bg-white">
      {/* Hero Section - Premium Background */}
      <section className="relative h-[600px] md:h-[800px] w-full overflow-hidden bg-black">
        {/* Background Images with Overlay */}
        {heroImages.map((img, idx) => (
          <div 
            key={img}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${activeHero === idx ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.45) 100%), url("${img}")`,
            }}
          />
        ))}
        
        {/* Gradient Overlay - Subtle for text readability */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)'}} />
        
        {/* Navigation Controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
          {/* Previous Arrow */}
          <button 
            onClick={() => setActiveHero((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all group"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">chevron_left</span>
          </button>

          {/* Dots */}
          <div className="flex gap-3">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveHero(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${activeHero === idx ? 'bg-[#fed000] w-10 ring-4 ring-[#fed000]/20' : 'bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>

          {/* Next Arrow */}
          <button 
            onClick={() => setActiveHero((prev) => (prev + 1) % heroImages.length)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all group"
          >
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
        </div>
        
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Gastronomía */}
          <div className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="material-symbols-outlined text-white/50 mb-3 block group-hover:scale-110 group-hover:text-secondary transition-all">restaurant</span>
              <h3 className="font-headline text-lg md:text-xl lg:text-2xl text-white font-black leading-tight">Gastronomía</h3>
              <div className="h-1 w-8 bg-[#fed000] mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          </div>
          
          {/* Hospedaje */}
          <div className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="material-symbols-outlined text-white/50 mb-3 block group-hover:scale-110 group-hover:text-secondary transition-all">apartment</span>
              <h3 className="font-headline text-lg md:text-xl lg:text-2xl text-white font-black leading-tight">Hospedaje</h3>
              <div className="h-1 w-8 bg-[#fed000] mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          </div>
          
          {/* Cultural */}
          <div className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="material-symbols-outlined text-white/50 mb-3 block group-hover:scale-110 group-hover:text-secondary transition-all">confirmation_number</span>
              <h3 className="font-headline text-lg md:text-xl lg:text-2xl text-white font-black leading-tight">Cultural</h3>
              <div className="h-1 w-8 bg-[#fed000] mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          </div>

          {/* Eventos */}
          <div className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="material-symbols-outlined text-white/50 mb-3 block group-hover:scale-110 group-hover:text-secondary transition-all">event</span>
              <h3 className="font-headline text-lg md:text-xl lg:text-2xl text-white font-black leading-tight">Eventos</h3>
              <div className="h-1 w-8 bg-[#fed000] mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          </div>

          {/* Servicios */}
          <div className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url("https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="material-symbols-outlined text-white/50 mb-3 block group-hover:scale-110 group-hover:text-secondary transition-all">construction</span>
              <h3 className="font-headline text-lg md:text-xl lg:text-2xl text-white font-black leading-tight">Servicios</h3>
              <div className="h-1 w-8 bg-[#fed000] mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
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
                  backgroundImage: 'url("https://images.unsplash.com/photo-1518182170546-07661fd94144?q=80&w=800&h=1000&auto=format&fit=crop")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/90 via-transparent to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-10">
                <div className="inline-flex items-center gap-3 mb-6 w-fit bg-[#fed000] px-5 py-2 rounded-xl shadow-lg">
                  <span className="text-[#003e6f] text-xs font-headline font-black uppercase tracking-widest">🔥 Trending #1</span>
                </div>
                <h3 className="font-headline text-5xl md:text-6xl text-white font-black mb-6 leading-tight !text-white">{t("destinoPrincipal")}</h3>
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
                  backgroundImage: 'linear-gradient(rgba(0,62,111,0.2), rgba(0,28,57,0.4)), url("https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600&h=400")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001c39]/80 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-10">
                <span className="text-cyan-300 !text-cyan-300 font-label text-xs uppercase tracking-widest mb-3 font-bold">{t("mexicoSur")}</span>
                <h3 className="font-headline text-3xl md:text-4xl text-white font-black mb-4 !text-white">{t("destinoSecundario")}</h3>
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

      {/* Offers Section - Premium Card Grid */}
      <section className="py-24 md:py-32 bg-white px-6 md:px-12 max-w-[1440px] mx-auto overflow-visible">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <span className="font-label text-secondary tracking-widest text-xs uppercase mb-4 block font-black">⚡ OPORTUNIDADES MUUL</span>
            <h2 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black leading-none">Ofertas <span className="text-secondary italic">Especiales</span></h2>
          </div>
          <Link href="/ofertas" className="flex items-center gap-3 text-[#003e6f] font-headline font-black text-sm uppercase tracking-widest hover:text-secondary transition-colors group">
            Ver todas las ofertas
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group relative bg-[#f8faff] rounded-[2.5rem] p-8 md:p-10 border border-[#003e6f]/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center border border-neutral-100">
                  <span className="material-symbols-outlined text-3xl text-secondary">local_fire_department</span>
                </div>
                {distancias[1] && (
                  <span className="text-[10px] font-black text-secondary bg-secondary/10 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">near_me</span>
                    {distancias[1]}
                  </span>
                )}
              </div>
              <h3 className="font-headline text-3xl text-[#003e6f] font-black mb-4">Tacos El Guero</h3>
              <p className="text-neutral-500 font-body mb-10 leading-relaxed">20% de descuento en todos los tacos al pastor. Solo con código MUUL26.</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="bg-secondary text-[#003e6f] font-headline font-black px-4 py-2 rounded-xl text-lg">-20% OFF</span>
                <Link href="/mapa?lat=19.423&lng=-99.163&id=1" className="w-12 h-12 rounded-full bg-[#003e6f] text-white flex items-center justify-center hover:bg-secondary hover:text-[#003e6f] transition-all border border-transparent">
                  <span className="material-symbols-outlined">map</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-[#003e6f] rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-[#003e6f]/20 hover:shadow-[#003e6f]/40 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <span className="material-symbols-outlined text-3xl text-[#fed000]">shopping_bag</span>
                </div>
                {distancias[2] && (
                  <span className="text-[10px] font-black text-[#fed000] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">near_me</span>
                    {distancias[2]}
                  </span>
                )}
              </div>
              <h3 className="font-headline text-3xl text-white font-black mb-4">Coppel Reforma</h3>
              <p className="text-white/60 font-body mb-10 leading-relaxed">Bono de $500 MXN en compras mayores a $3,000 en tecnología.</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="bg-[#fed000] text-[#003e6f] font-headline font-black px-4 py-2 rounded-xl text-lg">$500 MXN</span>
                <Link href="/mapa?lat=19.428&lng=-99.157&id=2" className="w-12 h-12 rounded-full bg-white text-[#003e6f] flex items-center justify-center hover:bg-[#fed000] transition-all">
                  <span className="material-symbols-outlined">map</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-[#fffcf0] rounded-[2.5rem] p-8 md:p-10 border border-[#fed000]/20 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fed000]/10 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center border border-neutral-100">
                  <span className="material-symbols-outlined text-3xl text-[#003e6f]">museum</span>
                </div>
                {distancias[3] && (
                  <span className="text-[10px] font-black text-[#003e6f] bg-[#fed000]/10 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">near_me</span>
                    {distancias[3]}
                  </span>
                )}
              </div>
              <h3 className="font-headline text-3xl text-[#003e6f] font-black mb-4">Soumaya VIP</h3>
              <p className="text-neutral-500 font-body mb-10 leading-relaxed">Pase premium 2x1 en visitas guiadas nocturnas. Cupos limitados.</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="bg-[#003e6f] text-white font-headline font-black px-4 py-2 rounded-xl text-lg">2x1</span>
                <Link href="/mapa?lat=19.440&lng=-99.204&id=3" className="w-12 h-12 rounded-full bg-[#fed000] text-[#003e6f] flex items-center justify-center hover:bg-[#003e6f] hover:text-white transition-all">
                  <span className="material-symbols-outlined">map</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-24"></div>
    </main>
  );
}
