"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { 
  User, 
  MapPin, 
  Route, 
  Star, 
  Settings, 
  LogOut,
  ChevronRight,
  Globe,
  Bell,
  Trash2,
  Menu,
  X
} from "lucide-react";
import clsx from "clsx";

type TabType = "cuenta" | "direcciones" | "rutas" | "resenas" | "ajustes" | "editar";

export default function PerfilPage() {
  const t = useTranslations("perfil");
  const supabase = createClient();
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("cuenta");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const { data, error } = await supabase.rpc('get_perfil_usuario_actual');
        
        if (error) {
          console.error("Error fetching profile:", error);
          throw error;
        }

        if (data && data.length > 0) {
          setPerfil(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
          <p className="text-on-surface-variant font-medium tracking-widest uppercase text-xs">{t("cargando")}</p>
        </div>
      </div>
    );
  }

  const sidebarItems: { id: TabType; icon: any; label: string }[] = [
    { id: "cuenta", icon: <User size={20} />, label: "Mi Cuenta" },
    { id: "direcciones", icon: <MapPin size={20} />, label: "Direcciones" },
    { id: "rutas", icon: <Route size={20} />, label: "Mis Rutas" },
    { id: "resenas", icon: <Star size={20} />, label: "Mis Reseñas" },
    { id: "editar", icon: <Settings size={20} />, label: "Ajustes" },
  ];

  const tiers = [
    { name: 'bronze', className: 'bg-[#a16207]/20 border-[#a16207]/30 text-[#fef3c7] shadow-[#a16207]/30' },
    { name: 'silver', className: 'bg-slate-400/20 border-slate-300/40 text-slate-100 shadow-slate-400/30' },
    { name: 'gold', className: 'bg-yellow-400/20 border-yellow-300/40 text-yellow-100 shadow-yellow-300/30' },
  ];

  const insigniasDestacadas = [
    { emoji: "🌮", label: "Maestro Taquero", description: "Visita 10 taquerías verificadas." },
    { emoji: "🏛️", label: "Explorador Prehispánico", description: "Completa la ruta de las 5 pirámides." },
    { emoji: "🏖️", label: "Amante del Sol", description: "Visita 3 playas diferentes en un mes." },
    { emoji: "🌶️", label: "Valiente del Chile", description: "Prueba 5 platillos picantes." },
  ].map(insignia => ({
    ...insignia,
    tier: tiers[Math.floor(Math.random() * tiers.length)]
  }));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen pt-16 lg:pt-20 lg:ml-80 bg-surface flex flex-col lg:flex-row">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-[#003e6f]"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-80 shrink-0 border-r border-outline-variant/10 p-8 flex flex-col gap-10 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out",
        "lg:top-20 lg:h-[calc(100vh-5rem)]",
        {
          "translate-x-0": isSidebarOpen,
          "-translate-x-full lg:translate-x-0": !isSidebarOpen,
        }
      )}>
        {/* Mobile Close Button */}
        <div className="lg:hidden absolute top-4 right-4">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-[#003e6f]/60 hover:text-[#003e6f]"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex flex-col gap-4 mt-8 lg:mt-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container shadow-sm">
              <img 
                src={perfil?.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&auto=format&fit=crop"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-primary font-headline italic text-lg leading-tight">Hola, <span className="font-bold">{perfil?.nombre_completo?.split(" ")[0] || "Usuario"}</span></p>
              {perfil?.username && (
                <p className="mt-1 inline-block bg-[#003e6f]/10 text-[#003e6f] text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md">
                  @{perfil.username}
                </p>
              )}
              <p className="text-on-surface-variant text-[10px] uppercase font-label tracking-widest mt-1">Miembro desde 2023</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false); // Close sidebar on selection
              }}
              className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all text-sm font-black uppercase tracking-widest ${
                activeTab === item.id 
                  ? "bg-[#fed000] text-[#003e6f] shadow-lg shadow-[#fed000]/20" 
                  : "text-[#003e6f]/50 hover:bg-slate-50"
              }`}
            >
              {item.icon}
              <span className="font-headline">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 pt-10 border-t border-outline-variant/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-3 text-error font-bold text-sm hover:bg-error/5 rounded-full transition-colors"
          >
            <LogOut size={20} />
            <span className="font-headline">{t("cerrarSesion")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 max-w-6xl mx-auto w-full">
        {activeTab === "cuenta" && (
          <div className="space-y-12 animate-fade-in-up">
            {/* Hero Section */}
            <header className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-[2.5rem] overflow-hidden group shadow-2xl">
              <img 
                src="" 
                alt="Paseo de la Reforma" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 z-10"></div>
              <div className="relative z-20 h-full p-8 md:p-12 flex flex-col justify-center gap-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline italic font-light text-white leading-tight">
                  {perfil?.nombre_completo || ""}
                </h1>

                {/* Mockup de Insignias */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {insigniasDestacadas.map((insignia, index) => (
                    <div 
                      key={insignia.label} 
                      className={clsx(
                        `flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2 text-sm shadow-lg transition-all hover:shadow-xl border ${insignia.tier.className}`,
                        {
                          'hidden md:flex': index >= 1 // Oculta insignias después de la primera en pantallas pequeñas
                        }
                      )}
                    >
                      <span className="text-lg">{insignia.emoji}</span>
                      <span className="font-bold tracking-wide">{insignia.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: t("rutasCompletadas"), value: "24", color: "bg-[#003e6f] text-white" },
                { label: t("puntosInteres"), value: "158", color: "bg-[#fed000] text-[#003e6f]" },
                { label: t("insigniasObtenidas"), value: "12", color: "bg-slate-100 text-[#003e6f]" },
              ].map((stat, idx) => (
                <div key={idx} className={`${stat.color} p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-sm border border-black/5 transition-transform hover:scale-[1.02] duration-300`}>
                  <span className="font-label font-black text-[10px] tracking-[0.2em] mb-4 opacity-70">{stat.label}</span>
                  <span className="text-6xl md:text-7xl font-headline italic font-light tracking-tighter">{stat.value}</span>
                </div>
              ))}
            </section>

            {/* Insignias Destacadas */}
            <section className="space-y-8">
              <h2 className="text-4xl font-headline italic text-primary">Insignias Destacadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {insigniasDestacadas.map((insignia) => (
                  <div key={insignia.label} className={`bg-surface-container-low p-8 rounded-[2.5rem] flex flex-col items-center text-center border hover:bg-white hover:shadow-xl transition-all ${insignia.tier.className}`}>
                    <span className="text-6xl mb-4">{insignia.emoji}</span>
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-2">{insignia.label}</h3>
                    <p className="text-sm text-on-surface-variant font-body">{insignia.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Mis Insignias */}
            <section className="space-y-8">
              <h2 className="text-4xl font-headline italic text-primary">Mis Insignias</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { emoji: "🎨", label: "Mecenas del Arte", description: "Visita 5 museos o galerías." },
                  { emoji: "☕", label: "Catador de Café", description: "Prueba cafés de 3 regiones distintas." },
                  { emoji: "🎶", label: "Noctámbulo Musical", description: "Asiste a 3 conciertos en vivo." },
                ].map((insignia) => {
                  const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
                  return (
                    <div key={insignia.label} className={`bg-surface-container-low p-8 rounded-[2.5rem] flex flex-col items-center text-center border hover:bg-white hover:shadow-xl transition-all ${randomTier.className}`}>
                      <span className="text-6xl mb-4">{insignia.emoji}</span>
                      <h3 className="font-headline font-bold text-xl text-on-surface mb-2">{insignia.label}</h3>
                      <p className="text-sm text-on-surface-variant font-body">{insignia.description}</p>
                    </div>
                  );
                })}
                <div className="border-2 border-dashed border-outline-variant/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="text-4xl">🏆</span>
                  <span className="font-bold text-center">Ver todas mis insignias</span>
                </div>
              </div>
            </section>

            {/* Reviews Section - The "Bottom Part" previously liked */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-headline italic text-primary">{t("recientesActividades")}</h2>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {/* Review Card 1 */}
                <div className="group bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-10 transition-all hover:shadow-2xl hover:bg-white border border-outline-variant/10">
                  <div className="w-full md:w-64 aspect-video md:aspect-square rounded-3xl overflow-hidden shrink-0 bg-surface-container-low shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?q=80&auto=format&fit=crop&w=400&h=400" 
                      alt="Palacio de Bellas Artes" 
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-headline font-bold text-on-surface mb-1">Casa del Mayorazgo de la Canal</h3>
                        <p className="text-sm font-label text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                          <MapPin size={14} /> San Miguel de Allende, Gto.
                        </p>
                      </div>
                      <span className="font-label text-xs text-slate-300 bg-surface-container-high px-3 py-1 rounded-full">14 MAR 2024</span>
                    </div>
                    <div className="flex gap-1 mb-6 text-secondary">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={20} fill="currentColor" stroke="none" />)}
                    </div>
                    <p className="text-on-surface-variant leading-relaxed font-body text-lg italic font-light">
                      “Una joya arquitectónica que te transporta en el tiempo. La curaduría de la exposición actual es impecable.”
                    </p>
                  </div>
                </div>

                {/* Review Card 2 */}
                <div className="group bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-10 transition-all hover:shadow-2xl hover:bg-white border border-outline-variant/10">
                  <div className="w-full md:w-64 aspect-video md:aspect-square rounded-3xl overflow-hidden shrink-0 bg-surface-container-low shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1512813588641-0737a3459ced?q=80&auto=format&fit=crop&w=400&h=400" 
                      alt="Restaurante en la Roma" 
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-headline font-bold text-on-surface mb-1">Restaurante Los Danzantes</h3>
                        <p className="text-sm font-label text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                          <Star size={14} /> Oaxaca de Juárez, Oax.
                        </p>
                      </div>
                      <span className="font-label text-xs text-slate-300 bg-surface-container-high px-3 py-1 rounded-full">02 FEB 2024</span>
                    </div>
                    <div className="flex gap-1 mb-6 text-secondary">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={20} fill="currentColor" stroke="none" />)}
                    </div>
                    <p className="text-on-surface-variant leading-relaxed font-body text-lg italic font-light">
                      “El mole negro es de otro planeta. El ambiente en el patio central es muy acogedor.”
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "direcciones" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-4xl font-headline italic text-primary">{t("direccionesGuardadas")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Hogar", address: "Av. Paseo de la Reforma 222, CDMX", icon: "home" },
                { label: "Trabajo", address: "Calle de la Innovación 50, Monterrey", icon: "work" },
              ].map((dir, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                  <div className="p-3 bg-surface-container-low rounded-xl text-primary">
                    <MapPin size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-xl mb-1">{dir.label === "Hogar" ? t("hogar") : t("trabajo")}</h3>
                    <p className="text-on-surface-variant font-body">{dir.address}</p>
                  </div>
                  <button className="text-on-surface-variant hover:text-error transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button className="border-2 border-dashed border-outline-variant/30 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-all">
                <MapPin size={24} />
                <span className="font-bold">{t("agregarDireccion")}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "rutas" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-4xl font-headline italic text-primary">{t("misRutas")}</h2>
            <div className="grid grid-cols-1 gap-6">
              {[
                { name: "Ruta del Tequila", date: "15 Mar 2024", stops: 5, time: "4.5h" },
                { name: "Joyas de San Miguel", date: "10 Feb 2024", stops: 8, time: "6h" },
              ].map((ruta, idx) => (
                <div key={idx} className="bg-white p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-[#fed000]/10 rounded-2xl flex items-center justify-center text-[#fed000]">
                    <Route size={32} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-headline font-bold text-2xl mb-1 text-[#003e6f]">{ruta.name}</h3>
                    <p className="text-[10px] text-[#003e6f]/40 font-black tracking-widest uppercase">{ruta.date} • {ruta.stops} Paradas • {ruta.time}</p>
                  </div>
                  <button className="bg-[#003e6f] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[11px] hover:brightness-110 transition-all shadow-lg shadow-[#003e6f]/20">
                    {t("verMapa")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "resenas" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-4xl font-headline italic text-primary">{t("misResenas")}</h2>
            <div className="grid grid-cols-1 gap-8">
              {/* Review Card 1 */}
              <div className="group bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-10 transition-all hover:shadow-2xl hover:bg-white border border-outline-variant/5">
                <div className="w-full md:w-64 aspect-video md:aspect-square rounded-3xl overflow-hidden shrink-0 bg-surface-container-low shadow-inner">
                  <img 
                    src="https://images.unsplash.com/photo-1518171029055-015096185ca8?q=80&auto=format&fit=crop&w=400&h=400" 
                    alt="Review Location" 
                    className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-headline font-bold text-on-surface mb-1">Casa del Mayorazgo de la Canal</h3>
                      <p className="text-sm font-label text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                        <MapPin size={14} /> CDMX
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-6 text-secondary">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={20} fill="currentColor" stroke="none" />)}
                  </div>
                  <p className="text-on-surface-variant leading-relaxed font-body text-lg italic font-light">
                    “Una joya arquitectónica que te transporta en el tiempo. La curaduría de la exposición actual es impecable.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "editar" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-4xl font-headline italic text-primary">{t("editarPerfil")}</h2>
            <div className="bg-white rounded-[2.5rem] border border-outline-variant/10 overflow-hidden p-8 md:p-12">
              <div className="max-w-2xl space-y-8">
                {/* Avatar Upload */}
                <div className="space-y-4">
                  <label className="block text-lg font-headline font-bold">{t("fotoPerfil")}</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-container shadow-lg">
                      <img 
                        src={perfil?.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&auto=format&fit=crop"} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button className="px-6 py-3 border-2 border-primary text-primary rounded-full font-bold hover:bg-primary/5 transition-colors">
                      {t("cambiarFoto")}
                    </button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <label className="block text-lg font-headline font-bold">{t("nombreCompleto")}</label>
                  <input 
                    type="text" 
                    defaultValue={perfil?.nombre_completo || "Miguel Cabrera"}
                    className="w-full px-6 py-3 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-low font-body text-lg focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block font-headline font-bold">Usuario</label>
                    <input 
                      type="text" 
                      placeholder="@username"
                      defaultValue="migueltravel"
                      className="w-full px-6 py-3 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-low font-body focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block font-headline font-bold">Teléfono</label>
                    <input 
                      type="tel" 
                      placeholder="+52 55 1234 5678"
                      defaultValue="+52 55 1234 5678"
                      className="w-full px-6 py-3 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-low font-body focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-4">
                  <label className="block font-headline font-bold">Biografía</label>
                  <textarea 
                    rows={4}
                    defaultValue="Explorador, viajero y Muul enthusiast. Descubriendo los mejores rincones de México 🇲🇽"
                    className="w-full px-6 py-3 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-low font-body focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Banner */}
                <div className="space-y-4">
                  <label className="block font-headline font-bold">Banner</label>
                  <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-outline-variant/30 bg-surface-container-low">
                    <img 
                      src="https://images.unsplash.com/photo-1518182170546-07661fd94144?q=80&w=1200&h=400&auto=format&fit=crop"
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button className="px-6 py-3 border-2 border-secondary text-secondary rounded-full font-bold hover:bg-secondary/5 transition-colors">
                    {t("cambiarBanner")}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button className="flex-1 bg-primary text-on-primary px-6 py-4 rounded-full font-headline font-bold text-lg hover:brightness-110 transition-all">
                    {t("guardarCambios")}
                  </button>
                  <button 
                    onClick={() => setActiveTab("cuenta")}
                    className="flex-1 border-2 border-outline-variant/30 text-on-surface px-6 py-4 rounded-full font-headline font-bold text-lg hover:bg-surface-container-low transition-all">
                    {t("cancelar")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
