"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="pt-20">
      {/* Hero Section - Premium Background */}
      <section className="relative h-[600px] md:h-[800px] w-full overflow-hidden bg-black">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%), url("https://images.unsplash.com/photo-1518182170546-07661fd94144?q=80&w=1920&h=1080&auto=format&fit=crop")',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/50" />
        
        {/* Content */}
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col justify-center items-start">
          {/* Label */}
          <div className="inline-flex items-center gap-2 mb-8 text-white/80 font-label text-xs uppercase tracking-[0.2em]">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Curaduría de Inteligencia Editorial
          </div>
          
          {/* Main Headline */}
          <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl text-white max-w-5xl leading-[1.1] mb-6 md:mb-8 font-black tracking-tight">
            Descubre lo <br className="hidden md:block" /><span className="italic font-light">mejor de México</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-white/85 text-lg md:text-xl max-w-2xl mb-10 md:mb-12 font-body leading-relaxed">
            Una selección curada de destinos, sabores y cultura local impulsada por la inteligencia de datos de Coppel.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/mapa"
              className="bg-yellow-400 text-black px-8 md:px-12 py-4 md:py-5 rounded-full font-headline font-black text-base md:text-lg hover:bg-yellow-300 transition-all shadow-2xl shadow-yellow-400/30 flex items-center justify-center gap-2 group"
            >
              Comenzar Viaje 
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <button className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-headline font-bold text-base md:text-lg hover:bg-white/20 hover:border-white/50 transition-all">
              Ver Catálogo
            </button>
          </div>
        </div>
      </section>

      {/* Category Cards - Explore by Interest */}
      <section className="py-20 md:py-32 bg-white px-6 md:px-12 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <span className="font-label text-yellow-500 tracking-widest text-xs uppercase mb-3 block font-black">✨ Explora</span>
            <h2 className="font-headline text-5xl md:text-6xl text-black font-black">Explora por Interés</h2>
          </div>
          <p className="text-gray-600 max-w-sm font-body text-base leading-relaxed">
            Filtros inteligentes diseñados para encontrar la esencia de cada rincón de México.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Green Card - Nature */}
          <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 h-80 md:h-96">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=600&h=800&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <span className="font-label text-green-300 text-xs uppercase tracking-widest mb-2 block font-bold">🌿 Naturaleza</span>
              <h3 className="font-headline text-3xl md:text-4xl text-white font-black">Refugios Locales</h3>
              <div className="h-1 w-12 bg-green-300 mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          </div>
          
          {/* Blue Card - Culture */}
          <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 h-80 md:h-96">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1471879832106-c7ab9019e8de?q=80&w=600&h=800&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <span className="font-label text-blue-300 text-xs uppercase tracking-widest mb-2 block font-bold">🎨 Cultura</span>
              <h3 className="font-headline text-3xl md:text-4xl text-white font-black">Arte y Herencia</h3>
              <div className="h-1 w-12 bg-blue-300 mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          </div>
          
          {/* Red Card - Gastronomy */}
          <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 h-80 md:h-96">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&h=800&auto=format&fit=crop")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <span className="font-label text-red-300 text-xs uppercase tracking-widest mb-2 block font-bold">🍽️ Gastronomía</span>
              <h3 className="font-headline text-3xl md:text-4xl text-white font-black">Sabores de Tierra</h3>
              <div className="h-1 w-12 bg-red-300 mt-4 rounded-full group-hover:w-16 transition-all duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Destinations Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-16">
            <span className="font-label text-yellow-500 tracking-widest text-xs uppercase mb-4 font-black">📊 Tendencias</span>
            <h2 className="font-headline text-5xl md:text-6xl text-black font-black mb-6">Destinos en Auge</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto rounded-full" />
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[650px]">
            {/* Large Featured Card - San Miguel de Allende */}
            <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 group cursor-pointer h-80 md:h-full">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1565008576549-bdde9e154310?q=80&w=800&h=1000&auto=format&fit=crop")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
                <div className="inline-flex items-center gap-2 mb-4 w-fit">
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-lg text-xs font-headline font-black uppercase tracking-widest">🔥 Trending #1</span>
                  <span className="text-white/70 font-label text-xs uppercase tracking-widest">Guanajuato</span>
                </div>
                <h3 className="font-headline text-4xl md:text-5xl text-white font-black mb-6 leading-tight">San Miguel de Allende</h3>
                <div className="flex gap-8 md:gap-12">
                  <div>
                    <span className="text-white/50 text-xs uppercase block font-label mb-2 font-bold">Búsquedas</span>
                    <span className="text-yellow-300 font-headline text-2xl font-black">+124%</span>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs uppercase block font-label mb-2 font-bold">Clima</span>
                    <span className="text-white font-headline text-2xl font-black">24°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Puerto Escondido Card */}
            <div className="md:col-span-2 relative rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer h-80 md:h-auto">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&h=400&auto=format&fit=crop")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
                <span className="text-blue-300 font-label text-xs uppercase tracking-widest mb-2 font-bold">🌊 Pacífico Sur</span>
                <h3 className="font-headline text-2xl md:text-3xl text-white font-black mb-2">Puerto Escondido</h3>
                <p className="text-white/80 text-sm font-body mb-4">Incremento en interés por experiencias sustentables.</p>
                <button className="text-yellow-300 font-headline font-bold text-sm flex items-center gap-2 group/btn">
                  Explorar Guía 
                  <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Stats Card 1 - Digital Resonance */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-lg h-80 md:h-auto hover:shadow-xl transition-all duration-300">
              <span className="material-symbols-outlined text-5xl opacity-80">insights</span>
              <div>
                <span className="font-headline text-4xl md:text-5xl font-black block">8.4k</span>
                <p className="font-label text-xs uppercase tracking-widest opacity-70 mt-2 font-bold">Resonancia Digital</p>
              </div>
            </div>

            {/* Stats Card 2 - Occupancy */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-lg h-80 md:h-auto hover:shadow-xl transition-all duration-300">
              <span className="material-symbols-outlined text-5xl opacity-80">hotel</span>
              <div>
                <span className="font-headline text-4xl md:text-5xl font-black block">92%</span>
                <p className="font-label text-xs uppercase tracking-widest opacity-70 mt-2 font-bold">Ocupación Hotelera</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA - Premium Section */}
      <section className="py-20 md:py-32 bg-white px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[3rem] p-8 md:p-16 lg:p-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
          
          {/* Content */}
          <div className="flex-1 relative z-10">
            <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white mb-6 font-black leading-tight">
              Únete a la <span className="italic font-light text-yellow-400">Inteligencia Editorial</span>
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-8 font-body leading-relaxed max-w-md">
              Recibe cada semana una curaduría profunda de destinos, productos locales y experiencias auténticas que están definiendo el nuevo México.
            </p>
            
            {/* Email Form */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input 
                type="email" 
                placeholder="tu@email.com" 
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-full text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-body"
              />
              <button className="px-8 py-4 bg-yellow-400 text-black rounded-full font-headline font-black text-base hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 whitespace-nowrap">
                Suscribirse
              </button>
            </div>
            
            <p className="text-white/50 text-sm mt-4 font-label">No compartimos tu email. Cancela en cualquier momento.</p>
          </div>
          
          {/* Illustration/Image */}
          <div className="flex-1 relative z-10 hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 to-blue-400/20 rounded-2xl blur-2xl" />
              <div 
                className="relative rounded-2xl overflow-hidden h-80 lg:h-96 bg-cover bg-center shadow-2xl"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1516321318423-f06f70fafcde?q=80&w=600&h=600&auto=format&fit=crop")'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Spacing */}
      <div className="h-20"></div>
    </main>
  );
}
