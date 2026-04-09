"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";
import { useTranslations } from "next-intl";
import { 
  FriendsService, 
  GamificationService 
} from "@/lib/services";
import type { Badge } from "@/lib/services/gamification.service";
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

type TabType = "cuenta" | "publicaciones" | "amigos" | "rutas" | "medallas" | "ajustes" | "direcciones" | "resenas" | "editar";

export default function PerfilPage() {
  return (
    <Suspense fallback={<div>Cargando perfil...</div>}>
      <PerfilContent />
    </Suspense>
  );
}

function PerfilContent() {
  const t = useTranslations("perfil");
  const supabase = createClient();
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get("tab") as TabType;
    return tabParam || "cuenta";
  });
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; username: string; status: string; online: boolean; avatar: string }[]>([]);

  const [rutasGuardadas, setRutasGuardadas] = useState<{ id: string; nombre: string; created_at: string; pois_data: any[]; modo_transporte: string; distancia_texto?: string; duracion_texto?: string }[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    FriendsService.getAmigos().then(setFriendsList);
  }, []);

  const profileId = searchParams.get("id");
  const [isPublicView, setIsPublicView] = useState(false);
  const [publicProfileData, setPublicProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // HACKATHON: Mocking public profile routing based on ?id
      // Dynamic lookup from our social user registry for perfect data consistency
      if (profileId && (!session || session.user.id !== profileId)) {
        setIsPublicView(true);
        
        const userBios: Record<string, string> = {
          u1: "Me encanta el arte, los museos y todo lo relacionado con la cultura. Siempre buscando la próxima exhibición. 🎨",
          u2: "Cazador de tacos legendarios y aventuras urbanas. Si no está picante, no es buena comida. 🌮🔥",
          u3: "Viajando poco a poco y conociendo mi propia ciudad de formas distintas. 🌎",
          u4: "Crítico gastronómico independiente. Pruebo, califico y comparto para que no pierdas tu tiempo ni tu dinero. 🍽️⭐",
          u5: "Nómada digital. Trabajo desde cafés bonitos y exploro la ciudad entre reuniones. 💻✈️",
          u6: "Fotógrafo callejero. Capturo la esencia de cada rincón de esta ciudad infinita. 📸",
          u7: "Fitness + turismo = mi estilo de vida. Corro por parques nuevos cada fin de semana. 🏃‍♀️🌿",
          u8: "Chef retirado. Ahora me dedico a descubrir la comida callejera más auténtica de México. 👨‍🍳🇲🇽",
        };

        const knownUsers: Record<string, { name: string; username: string; avatar: string; level: string; points: number }> = {
          u1: { name: "Ana Martínez", username: "@viajera66", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop", level: "Guía Maestro", points: 4500 },
          u2: { name: "Carlos R.", username: "@carlos_explorador", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop", level: "Aventurero Veterano", points: 3200 },
          u3: { name: "Sofía Navarro", username: "@sofia_cdmx", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop", level: "Turista Curioso", points: 1200 },
          u4: { name: "Diego Hernández", username: "@foodie_mx", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop", level: "Crítico Gourmet", points: 5100 },
          u5: { name: "Lucía Ramírez", username: "@lu_traveler", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop", level: "Nómada Digital", points: 2800 },
          u6: { name: "Marco Villanueva", username: "@marco_photo", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop", level: "Fotógrafo Urbano", points: 3900 },
          u7: { name: "Valentina Orozco", username: "@vale_fit", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop", level: "Exploradora Activa", points: 1800 },
          u8: { name: "Pedro Castañeda", username: "@el_chef_pedro", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop", level: "Leyenda Local", points: 6200 },
        };

        const found = knownUsers[profileId];
        const isFriend = profileId === "u1" || profileId === "u2" || profileId === "u6";
        
        setPublicProfileData({
          id: profileId,
          nombre_completo: found?.name || "Explorador Activo",
          username: found?.username || `@explorer_${profileId}`,
          avatar_url: found?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop",
          level: found?.level || "Aventurero",
          about: userBios[profileId] || "Descubriendo nuevos lugares cada día. ¡Sígueme en mis aventuras!",
          points: found?.points || 500,
          isFriend: isFriend,
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_perfil_usuario_actual');
        
        if (error) {
          console.error("Error fetching profile:", error);
          // HACKATHON: Fallback - build profile from auth session metadata
          if (session?.user) {
            const meta = session.user.user_metadata;
            setPerfil({
              nombre_completo: meta?.nombre_completo || meta?.full_name || session.user.email?.split('@')[0] || 'Usuario',
              correo: session.user.email,
              avatar_url: meta?.avatar_url || null,
              nivel_actual: 'Explorador',
              puntos_totales: 120,
              rutas_completadas: 3,
              insignias: 2,
            });
          }
        } else if (data && data.length > 0) {
          setPerfil(data[0]);
        } else if (session?.user) {
          // RPC returned empty - build from auth
          const meta = session.user.user_metadata;
          setPerfil({
            nombre_completo: meta?.nombre_completo || meta?.full_name || session.user.email?.split('@')[0] || 'Usuario',
            correo: session.user.email,
            avatar_url: meta?.avatar_url || null,
            nivel_actual: 'Explorador',
            puntos_totales: 120,
            rutas_completadas: 3,
            insignias: 2,
          });
        }
      } catch (err) {
        console.error(err);
        // Ultimate fallback
        if (session?.user) {
          const meta = session.user.user_metadata;
          setPerfil({
            nombre_completo: meta?.nombre_completo || meta?.full_name || session.user.email?.split('@')[0] || 'Usuario',
            correo: session.user.email,
            avatar_url: meta?.avatar_url || null,
            nivel_actual: 'Explorador',
            puntos_totales: 120,
            rutas_completadas: 3,
            insignias: 2,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [supabase, profileId]);

  // Load user data and badges
  const [currentUser, setCurrentUser] = useState<{ nombre: string, initials: string, avatar_url: string | null } | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const perfilData = await getPerfilCompat(supabase, user.id);
        const nombre = perfilData?.nombre_completo || user.user_metadata?.nombre_completo || user.email || "Usuario";
        const parts = nombre.split(" ");
        const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
        
        setPerfil({
           ...perfilData,
           nombre_completo: nombre,
           puntos_totales: perfilData?.puntos || 0,
           nivel_actual: perfilData?.nivel || "Explorador Novato"
        });
        
        setCurrentUser({ nombre, initials, avatar_url: perfilData?.avatar_url || null });

        // Load real badges
        const userBadges = await GamificationService.getBadges(user.id);
        setBadges(userBadges);
      }
    };
    fetchUserData();
  }, [supabase]);

  // Load persisted routes from Supabase (real data)
  // SUPABASE SWAP: Already real — just requires rows in rutas_guardadas table
  useEffect(() => {
    const loadRutas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('rutas_guardadas')
        .select('id, nombre, created_at, pois_data, modo_transporte, distancia_texto, duracion_texto')
        .eq('usuario_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data && data.length > 0) setRutasGuardadas(data);
    };
    loadRutas();
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

  if (isPublicView && publicProfileData) {
    return (
      <main className="min-h-screen bg-[#f8fafd] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[2.5rem] border border-outline-variant/20 shadow-xl overflow-hidden animate-fade-in-up">
            <div className="h-48 md:h-64 bg-gradient-to-r from-[#003e6f] to-[#005596] relative">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
            </div>
            
            <div className="px-8 pb-10 relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between -mt-20 md:-mt-24 mb-6">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-surface mb-4 md:mb-0">
                  <img src={publicProfileData.avatar_url} alt={publicProfileData.nombre_completo} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setPublicProfileData({...publicProfileData, isFriend: !publicProfileData.isFriend});
                      setRequestSent(true);
                    }}
                    className={`px-8 py-3 rounded-full font-headline font-black text-sm uppercase tracking-widest transition-all shadow-md ${publicProfileData.isFriend ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300' : 'bg-[#fed000] text-[#003e6f] hover:bg-[#ffdf40] hover:shadow-[0_0_15px_rgba(254,208,0,0.4)]'}`}
                  >
                    {publicProfileData.isFriend ? "Amigos ✔" : requestSent ? "Solicitud Enviada" : "Agregar a Red"}
                  </button>
                  <button className="bg-surface-container-highest w-12 h-12 rounded-full flex items-center justify-center text-primary hover:bg-secondary/20 transition-colors shadow-sm">
                    <Globe size={20} />
                  </button>
                </div>
              </div>
              
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-[#003e6f] mb-1">
                  {publicProfileData.nombre_completo}
                </h1>
                <p className="text-neutral-500 font-label text-base">{publicProfileData.username} • {publicProfileData.level}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100 flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-4xl text-secondary mb-2">workspace_premium</span>
                  <p className="text-3xl font-black text-[#003e6f]">{publicProfileData.points}</p>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Puntos de Ruta</p>
                </div>
                <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100 flex flex-col items-center justify-center text-center col-span-2">
                  <span className="material-symbols-outlined text-3xl text-neutral-400 mb-2">format_quote</span>
                  <p className="text-on-surface-variant font-body italic text-center text-lg leading-relaxed">
                    &quot;{publicProfileData.about}&quot;
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-headline font-black text-xl text-[#003e6f] border-b border-neutral-100 pb-3">Rutas Recientes</h3>
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-16 h-16 bg-[#003e6f]/5 rounded-2xl flex items-center justify-center shrink-0">
                    <Route size={32} className="text-[#003e6f]" />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-[#003e6f] text-lg">Tour Gastronómico Centro Histórico</h4>
                    <p className="font-body text-neutral-500 text-sm">3 Paradas • 2.5 km • Hace 2 días</p>
                  </div>
                  <button className="md:ml-auto font-bold text-[#005596] hover:underline text-sm">Ver Ruta en Mapa</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    );
  }

  const sidebarItems: { id: TabType; icon: any; label: string }[] = [
    { id: "cuenta", icon: <User size={20} />, label: "Mi Cuenta" },
    { id: "publicaciones", icon: <Globe size={20} />, label: "Mis Publicaciones" },
    { id: "amigos", icon: <Globe size={20} />, label: "Mis Amigos" },
    { id: "rutas", icon: <Route size={20} />, label: "Mis Rutas" },
    { id: "medallas", icon: <Star size={20} />, label: "Medallas & Gamificación" },
    { id: "ajustes", icon: <Settings size={20} />, label: "Ajustes" },
  ];

  const tiers = {
    bronze: 'bg-[#a16207]/20 border-[#a16207]/30 text-[#fef3c7] shadow-[#a16207]/30',
    silver: 'bg-slate-400/20 border-slate-300/40 text-slate-100 shadow-slate-400/30',
    gold: 'bg-yellow-400/20 border-yellow-300/40 text-yellow-100 shadow-yellow-300/30',
  };

  const getTierClass = (badge: Badge) => tiers[badge.tier] || tiers.bronze;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen pt-16 lg:pt-20 bg-surface flex flex-col lg:flex-row">
      {/* Menu Button */}
      <div className="fixed top-20 left-4 z-50 lg:top-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-[#003e6f]"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Modal */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-80 shrink-0 border-r border-outline-variant/10 p-8 flex flex-col gap-10 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out",
        "lg:top-0 lg:h-full", // Full height on desktop
        {
          "translate-x-0": isSidebarOpen,
          "-translate-x-full": !isSidebarOpen,
        }
      )}>
        {/* Close Button */}
        <div className="absolute top-4 right-4">
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
      <div className={clsx(
        "flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 max-w-6xl mx-auto w-full transition-all duration-300",
        {
          "blur-lg pointer-events-none": isSidebarOpen,
        }
      )}>
        {activeTab === "cuenta" && (
          <div className="space-y-12 animate-fade-in-up">
            {/* Hero Section */}
            <header className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-[2.5rem] overflow-hidden group shadow-2xl">
              <img 
                src={perfil?.banner_url || "https://images.unsplash.com/photo-1548682023-74bfff41b214?q=80&w=1200&h=400&auto=format&fit=crop"} 
                alt="Banner de perfil" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 z-10"></div>
              <div className="relative z-20 h-full p-8 md:p-12 flex flex-col justify-center gap-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline italic font-light text-white leading-tight">
                  {perfil?.nombre_completo || ""}
                </h1>

                {/* Mockup de Insignias */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {badges.slice(0, 3).map((insignia, index) => (
                    <div 
                      key={insignia.id} 
                      className={clsx(
                        `flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2 text-sm shadow-lg transition-all hover:shadow-xl border ${getTierClass(insignia)}`,
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
                { label: t("rutasCompletadas"), value: rutasGuardadas.length || "0", color: "bg-[#003e6f] text-white" },
                { label: t("puntosInteres"), value: perfil?.puntos_totales || "0", color: "bg-[#fed000] text-[#003e6f]" },
                { label: t("insigniasObtenidas"), value: badges.length || "0", color: "bg-slate-100 text-[#003e6f]" },
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
                {badges.map((badge) => (
                  <div key={badge.label} className={`bg-surface-container-low p-8 rounded-[2.5rem] flex flex-col items-center text-center border hover:bg-white hover:shadow-xl transition-all ${getTierClass(badge)}`}>
                    <span className="text-6xl mb-4">{badge.emoji}</span>
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-2">{badge.label}</h3>
                    <p className="text-sm text-on-surface-variant font-body">{badge.description}</p>
                    {badge.progress !== undefined && badge.total !== undefined && (
                      <div className="mt-4 w-full">
                        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-current transition-all duration-1000" 
                             style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                           />
                        </div>
                        <p className="text-[10px] mt-2 font-bold uppercase tracking-widest opacity-60">
                           {badge.progress}/{badge.total} {t("completado")}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Mis Insignias */}
            <section className="space-y-8">
              <h2 className="text-4xl font-headline italic text-primary">Mis Insignias Recientes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { emoji: "🎨", label: "Mecenas del Arte", description: "Visita 5 museos o galerías." },
                  { emoji: "☕", label: "Catador de Café", description: "Prueba cafés de 3 regiones distintas." },
                ].map((insignia) => (
                  <div key={insignia.label} className="bg-surface p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
                    <span className="text-6xl mb-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">{insignia.emoji}</span>
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-2">{insignia.label}</h3>
                    <p className="text-sm text-on-surface-variant font-body">{insignia.description}</p>
                    <div className="mt-4 w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-3/5"></div>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2 font-label">3/5 visitas</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- NUEVAS SECCIONES SOCIALES --- */}
        {activeTab === "publicaciones" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-4xl font-headline italic text-primary">Mis Publicaciones</h2>
            <div className="bg-white rounded-[2rem] p-12 text-center border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-neutral-300 mb-4">post_add</span>
              <p className="font-headline text-2xl text-[#003e6f] font-bold mb-2">Aún no has publicado nada</p>
              <p className="text-neutral-500 font-body mb-6">Comparte tus rutas o deja reseñas para que aparezcan aquí.</p>
              <button 
                onClick={() => window.location.href = "/comunidad"}
                className="bg-[#fed000] text-[#003e6f] px-8 py-3 rounded-full font-headline font-black text-sm uppercase tracking-widest hover:bg-[#ffdf40] transition-colors shadow-sm focus:outline-none"
              >
                Ir a Comunidad
              </button>
            </div>
          </div>
        )}

        {activeTab === "amigos" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-4xl font-headline italic text-primary">Mis Amigos</h2>
            <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-sm min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <input 
                  type="text" 
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Buscar amigos por @nombre..." 
                  className="bg-neutral-100 border border-transparent focus:bg-white focus:border-[#fed000] px-6 py-3 rounded-full w-full max-w-md font-body text-sm outline-none transition-colors"
                />
              </div>
              
              {friendSearch.length > 0 ? (
                <div className="animate-fade-in-up mt-8">
                  <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop" alt="Sofia" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-headline font-bold text-[#003e6f]">Sofía Navarro</p>
                        <p className="text-xs text-neutral-500">@sofia_cdmx</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setRequestSent(true)}
                      disabled={requestSent}
                      className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${requestSent ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed' : 'bg-[#003e6f] text-white hover:bg-[#005596]'}`}
                    >
                      {requestSent ? 'Enviada' : 'Agregar'}
                    </button>
                  </div>
                </div>
              ) : friendsList.length > 0 ? (
                <div className="animate-fade-in-up mt-8 space-y-4">
                  {friendsList.map((friend) => (
                    <div key={friend.id} className={`flex items-center justify-between p-4 rounded-2xl border border-outline-variant/10 hover:bg-neutral-50 transition-colors ${!friend.online ? 'opacity-70' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-transparent">
                          <img src={friend.avatar} alt={friend.name} className={`w-full h-full object-cover ${!friend.online ? 'grayscale' : ''}`} />
                          {friend.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                        </div>
                        <div>
                          <p className="font-headline font-bold text-[#003e6f] flex items-center gap-2">{friend.name}</p>
                          <p className="text-xs text-neutral-500">{friend.username} • {friend.status}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          await FriendsService.eliminarAmigo(friend.id);
                          setFriendsList(prev => prev.filter(f => f.id !== friend.id));
                        }}
                        className="text-neutral-400 hover:text-red-500 bg-transparent hover:bg-red-50 transition-all p-2 rounded-full flex items-center justify-center shrink-0"
                        title="Eliminar amigo"
                      >
                        <span className="material-symbols-outlined text-[20px]">person_remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                  <span className="material-symbols-outlined text-6xl text-neutral-300 mb-4">group_off</span>
                  <p className="font-headline text-2xl text-[#003e6f] font-bold mb-2">Lista Vacía</p>
                  <p className="text-neutral-500 font-body text-center max-w-sm">Has eliminado a todos tus amigos de la lista.</p>
                </div>
              )}
            </div>
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
              {rutasGuardadas.length > 0 ? rutasGuardadas.map((ruta) => (
                <div key={ruta.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-[#fed000]/10 rounded-2xl flex items-center justify-center text-[#fed000]">
                    <Route size={32} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-headline font-bold text-2xl mb-1 text-[#003e6f]">{ruta.nombre}</h3>
                    <p className="text-[10px] text-[#003e6f]/40 font-black tracking-widest uppercase">
                      {new Date(ruta.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} • {ruta.pois_data?.length || 0} Paradas • {ruta.modo_transporte} {ruta.distancia_texto ? `• ${ruta.distancia_texto}` : ''}
                    </p>
                  </div>
                  <a href={`/mapa?ruta=${ruta.id}`} className="bg-[#003e6f] !text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[11px] hover:brightness-110 transition-all shadow-lg shadow-[#003e6f]/20">
                    {t("verMapa")}
                  </a>
                </div>
              )) : (
                <div className="bg-white p-12 rounded-[2rem] border border-outline-variant/10 shadow-sm text-center">
                  <span className="material-symbols-outlined text-6xl text-neutral-300 mb-4 block">route</span>
                  <p className="font-headline text-2xl text-[#003e6f] font-bold mb-2">Aún no has guardado rutas</p>
                  <p className="text-neutral-500 font-body mb-6">Explora el mapa y guarda tus rutas favoritas.</p>
                  <a href="/mapa" className="inline-block bg-[#fed000] text-[#003e6f] px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#ffdf40] transition-colors">
                    Abrir Mapa
                  </a>
                </div>
              )}
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

      {/* Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </main>
  );
}
