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
            backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.85) 100%), url("https://images.unsplash.com/photo-1518182170546-07661fd94144?q=80&w=1920&h=1080&auto=format&fit=crop")',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.75) 100%)'}} />
        
        {/* Content */}
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col justify-center items-start">
          {/* Label */}
          <div className="inline-flex items-center gap-2 mb-8 font-label text-xs uppercase tracking-[0.2em]" style={{color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9)'}}>
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Curaduría de Inteligencia Editorial
          </div>
          
          {/* Main Headline */}
          <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl max-w-5xl leading-[1.1] mb-6 md:mb-8 font-black tracking-tight" style={{color: '#FFFFFF', textShadow: '0 0 50px rgba(0,0,0,1), 3px 3px 12px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)'}}>
            Descubre lo <br className="hidden md:block" /><span className="italic font-light" style={{color: '#FFFFFF'}}>mejor de México</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl max-w-2xl mb-10 md:mb-12 font-body leading-relaxed" style={{color: '#FFFFFF', textShadow: '0 0 30px rgba(0,0,0,1), 2px 2px 8px rgba(0,0,0,0.9)'}}>
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
          <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-300 h-80 md:h-96 border-4 border-emerald-300/30">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url("https://images.pexels.com/photos/3537903/pexels-photo-3537903.jpeg?auto=compress&cs=tinysrgb&w=600&h=800")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent">
              <span className="font-label text-emerald-300 text-xs uppercase tracking-widest mb-3 block font-bold drop-shadow-2xl">🌿 Naturaleza</span>
              <h3 className="font-headline text-4xl md:text-5xl text-white font-black drop-shadow-2xl">Refugios Locales</h3>
              <div className="h-1.5 w-16 bg-emerald-400 mt-4 rounded-full group-hover:w-20 transition-all duration-300" />
            </div>
          </div>
          
          {/* Blue Card - Culture */}
          <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-300 h-80 md:h-96 border-4 border-cyan-300/30">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url("https://images.pexels.com/photos/1537671/pexels-photo-1537671.jpeg?auto=compress&cs=tinysrgb&w=600&h=800")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent">
              <span className="font-label text-cyan-300 text-xs uppercase tracking-widest mb-3 block font-bold drop-shadow-2xl">🎨 Cultura</span>
              <h3 className="font-headline text-4xl md:text-5xl text-white font-black drop-shadow-2xl">Arte y Herencia</h3>
              <div className="h-1.5 w-16 bg-cyan-400 mt-4 rounded-full group-hover:w-20 transition-all duration-300" />
            </div>
          </div>
          
          {/* Red Card - Gastronomy */}
          <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-300 h-80 md:h-96 border-4 border-orange-300/30">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url("https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600&h=800")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent">
              <span className="font-label text-orange-300 text-xs uppercase tracking-widest mb-3 block font-bold drop-shadow-2xl">🍽️ Gastronomía</span>
              <h3 className="font-headline text-4xl md:text-5xl text-white font-black drop-shadow-2xl">Sabores de Tierra</h3>
              <div className="h-1.5 w-16 bg-orange-400 mt-4 rounded-full group-hover:w-20 transition-all duration-300" />
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
            <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 group cursor-pointer h-80 md:h-full border-4 border-yellow-300/30">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1518182170546-07661fd94144?q=80&w=800&h=1000&auto=format&fit=crop")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 bg-gradient-to-t from-black/50 to-transparent">
                <div className="inline-flex items-center gap-2 mb-4 w-fit">
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-400 text-black px-4 py-2 rounded-lg text-xs font-headline font-black uppercase tracking-widest shadow-lg shadow-yellow-400/30">🔥 Trending #1</span>
                  <span className="text-yellow-300 font-label text-xs uppercase tracking-widest font-bold drop-shadow-lg">Guanajuato</span>
                </div>
                <h3 className="font-headline text-5xl md:text-6xl text-white font-black mb-6 leading-tight drop-shadow-lg">San Miguel de Allende</h3>
                <div className="flex gap-12 md:gap-16">
                  <div className="bg-black/40 backdrop-blur-md px-4 py-3 rounded-xl">
                    <span className="text-yellow-300 text-xs uppercase block font-label mb-2 font-bold">Búsquedas</span>
                    <span className="text-yellow-300 font-headline text-3xl font-black drop-shadow-lg">+124%</span>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md px-4 py-3 rounded-xl">
                    <span className="text-yellow-300 text-xs uppercase block font-label mb-2 font-bold">Clima</span>
                    <span className="text-white font-headline text-3xl font-black drop-shadow-lg">24°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Puerto Escondido Card */}
            <div className="md:col-span-2 relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 group cursor-pointer h-80 md:h-auto border-4 border-blue-300/30">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%), url("https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600&h=400")'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-blue-300 font-label text-xs uppercase tracking-widest mb-3 font-bold drop-shadow-2xl">🌊 Pacífico Sur</span>
                <h3 className="font-headline text-3xl md:text-4xl text-white font-black mb-3 drop-shadow-2xl">Puerto Escondido</h3>
                <p className="text-white text-base font-body mb-5 drop-shadow-2xl">Incremento en interés por experiencias sustentables y ecoturismo.</p>
                <button className="text-yellow-300 font-headline font-black text-base flex items-center gap-2 group/btn bg-gradient-to-r from-yellow-400/30 to-blue-400/30 backdrop-blur-md px-4 py-2 rounded-lg w-fit hover:from-yellow-400/40 hover:to-blue-400/40 transition-all drop-shadow-2xl border border-yellow-300/30">
                  Explorar Guía 
                  <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Stats Card 1 - Digital Resonance */}
            <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-2xl h-80 md:h-auto hover:shadow-3xl transition-all duration-300 border-2 border-cyan-300/30">
              <span className="material-symbols-outlined text-6xl drop-shadow-lg">insights</span>
              <div>
                <span className="font-headline text-5xl md:text-6xl font-black block drop-shadow-lg">8.4k</span>
                <p className="font-label text-xs uppercase tracking-widest mt-2 font-bold drop-shadow-lg text-cyan-100">Resonancia Digital</p>
              </div>
            </div>

            {/* Stats Card 2 - Occupancy */}
            <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 rounded-3xl p-6 md:p-8 text-black flex flex-col justify-between shadow-2xl h-80 md:h-auto hover:shadow-3xl transition-all duration-300 border-2 border-yellow-300/30">
              <span className="material-symbols-outlined text-6xl drop-shadow-lg">hotel</span>
              <div>
                <span className="font-headline text-5xl md:text-6xl font-black block drop-shadow-lg">92%</span>
                <p className="font-label text-xs uppercase tracking-widest mt-2 font-bold drop-shadow-lg text-yellow-900">Ocupación Hotelera</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA - Premium Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-100 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[3rem] p-8 md:p-16 lg:p-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative overflow-hidden border-2 border-cyan-300/40 shadow-2xl">
          {/* Decorative animated elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-300/30 to-cyan-300/30 rounded-full blur-3xl -z-10 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-300/30 to-purple-300/30 rounded-full blur-3xl -z-10 animate-pulse" />
          
          {/* Content */}
          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-2 mb-6 text-white font-label text-xs uppercase tracking-[0.2em] bg-white/15 px-4 py-2 rounded-full border border-white/30 w-fit font-bold drop-shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              ✨ Sé parte del movimiento
            </div>
            
            <h2 className="font-headline text-5xl md:text-6xl lg:text-7xl text-white mb-8 font-black leading-tight drop-shadow-lg">
              Únete a la <br className="hidden md:block" /><span className="bg-gradient-to-r from-yellow-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent italic font-light">Inteligencia Editorial</span>
            </h2>
            
            <p className="text-white/90 text-lg md:text-xl mb-10 font-body leading-relaxed max-w-lg drop-shadow-lg">
              Recibe cada semana una curaduría profunda de destinos, productos locales, experiencias auténticas y tendencias que están redefiniendo el nuevo México.
            </p>
            
            {/* Email Form - Enhanced */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mb-6">
              <input 
                type="email" 
                placeholder="tu@email.com" 
                className="flex-1 px-6 py-4 bg-white/20 border-2 border-white/40 backdrop-blur-xl rounded-full text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all font-body font-medium shadow-lg drop-shadow-lg"/>
              <button className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-amber-400 text-black rounded-full font-headline font-black text-base hover:from-yellow-300 hover:to-amber-300 transition-all shadow-2xl shadow-yellow-400/40 whitespace-nowrap drop-shadow-lg hover:scale-105 hover:shadow-3xl">
                Suscribirse
              </button>
            </div>
            
            <p className="text-white text-sm font-label drop-shadow-lg">✓ No compartimos tu email. Cancela en cualquier momento.</p>
          </div>
          
          {/* Illustration/Image - Enhanced */}
          <div className="flex-1 relative z-10 hidden lg:flex items-center justify-center">
            <div className="relative w-full h-96">
              <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400/30 via-cyan-400/30 to-blue-400/30 rounded-3xl blur-3xl" />
              <div 
                className="relative rounded-3xl overflow-hidden h-96 bg-cover bg-center shadow-2xl border-2 border-cyan-400/30"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(0, 20, 60, 0.7) 0%, rgba(5, 30, 80, 0.6) 50%, rgba(0, 10, 50, 0.7) 100%), url("https://images.pexels.com/photos/3571899/pexels-photo-3571899.jpeg?auto=compress&cs=tinysrgb&w=600&h=600")'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 via-transparent to-blue-600/30" />
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
