"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";
import { optimizarOrdenTSP } from "@/lib/haversine";
import type { POI } from "@/types/database";
import html2canvas from "html2canvas";
import ChatModal from "@/components/ui/ChatModal";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

/* ── Types ── */
interface UserInfo {
  initials: string;
  nombre: string;
}

interface RutaGeo {
  indice: number;
  geometry: GeoJSON.LineString;
  distancia_texto: string;
  duracion_texto: string;
  distancia_metros: number;
  duracion_segundos: number;
  pasos: { instruccion: string; distancia: number; duracion: number }[];
}

interface PuntoRuta {
  latitud: number;
  longitud: number;
  nombre?: string;
}

/* ── Route colors for up to 3 alternatives ── */
const ROUTE_COLORS = ["#98d5a2", "#b0c6fd", "#ffb3b3"];

/* ── Visit duration by category (minutes) ── */
const DURACION_VISITA: Record<string, number> = {
  cultural: 60, comida: 45, tienda: 30, deportes: 90, servicio: 20,
};

async function obtenerRutasMapbox(
  puntos: PuntoRuta[],
  idioma: string,
  perfil: "caminando" | "accesible" | "vehiculo"
): Promise<RutaGeo[]> {
  const response = await fetch("/api/ruta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ puntos, idioma, perfil }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || `Route API error ${response.status}`);
  return data?.rutas || [];
}

/* ── Calculate estimated arrival times ── */
function calcularHorasLlegada(poisRuta: POI[], ruta: RutaGeo | undefined): string[] {
  if (!ruta || poisRuta.length === 0) return [];
  const ahora = new Date();
  let minutosAcumulados = 0;
  const horas: string[] = [];
  poisRuta.forEach((poi, i) => {
    if (i > 0 && ruta.pasos.length > 0) {
      const tiempoCaminataTotal = ruta.duracion_segundos / 60;
      const porLeg = tiempoCaminataTotal / Math.max(poisRuta.length - 1, 1);
      minutosAcumulados += porLeg;
    }
    const llegada = new Date(ahora.getTime() + minutosAcumulados * 60000);
    horas.push(llegada.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true }));
    minutosAcumulados += DURACION_VISITA[poi.categoria] || 30;
  });
  return horas;
}

/* ── Route cache ── */
function getCacheKey(pois: POI[], idioma: string): string {
  return `muul-ruta-${pois.map((p) => p.id).sort().join(",")}-${idioma}`;
}
function getRouteCache(key: string): RutaGeo[] | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { rutas, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > 3600000) { localStorage.removeItem(key); return null; }
    return rutas;
  } catch { return null; }
}
function setRouteCache(key: string, rutas: RutaGeo[]) {
  try { localStorage.setItem(key, JSON.stringify({ rutas, timestamp: Date.now() })); } catch {}
}

/* ── Helpers ── */
function getMarkerColor(cat: string): string {
  const m: Record<string, string> = { comida: "#ffb3b3", cultural: "#b0c6fd", deportes: "#98d5a2", tienda: "#8a8a8e", servicio: "#8a8a8e" };
  return m[cat] ?? "#8a8a8e";
}
function isOpenNow(poi: POI): boolean {
  if (!poi.horario_apertura || !poi.horario_cierre) return false;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const [aH, aM] = poi.horario_apertura.split(":").map(Number);
  const [cH, cM] = poi.horario_cierre.split(":").map(Number);
  const apertura = aH * 60 + (aM || 0);
  const cierre = cH * 60 + (cM || 0);
  if (cierre < apertura) return currentMin >= apertura || currentMin <= cierre;
  return currentMin >= apertura && currentMin <= cierre;
}

/* ══════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function MapaPage() {
  const supabase = createClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const itinerarioRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("mapa");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const filters = [
    { label: t("todos"), emoji: "🗺️", value: "todos" },
    { label: t("comida"), emoji: "🍜", value: "comida" },
    { label: t("cultural"), emoji: "🏛️", value: "cultural" },
    { label: t("deportes"), emoji: "⚽", value: "deportes" },
    { label: t("tiendas"), emoji: "🛍️", value: "tienda" },
  ];

  // POI state
  const [pois, setPois] = useState<POI[]>([]);
  const [filteredPois, setFilteredPois] = useState<POI[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Route state
  const [poisEnRuta, setPoisEnRuta] = useState<POI[]>([]);
  const [rutas, setRutas] = useState<RutaGeo[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(0);
  const [mostrarItinerario, setMostrarItinerario] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [rutaError, setRutaError] = useState("");
  const [ubicacionUsuario, setUbicacionUsuario] = useState<[number, number] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoMsg, setGuardadoMsg] = useState("");
  const [rutasGuardadas, setRutasGuardadas] = useState<any[]>([]);
  const [mostrarGuardadas, setMostrarGuardadas] = useState(false);
  const [modoAccesible, setModoAccesible] = useState(false);
  const [modoVehiculo, setModoVehiculo] = useState(false);
  const [rutaAccesible, setRutaAccesible] = useState<RutaGeo | null>(null);
  const [rutaVehiculo, setRutaVehiculo] = useState<RutaGeo | null>(null);
  const [chatbotAbierto, setChatbotAbierto] = useState(false);

  // Mobile bottom sheet state
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Real user state for avatar
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Share menu state
  const [compartirMenuOpen, setCompartirMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const perfil = await getPerfilCompat(supabase, user.id);
        const nombre = perfil?.nombre_completo || user.email || t("usuarioAnonimo");
        const parts = nombre.split(" ");
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : nombre.substring(0, 2).toUpperCase();
        setUserInfo({ initials, nombre });
      } else {
        setUserInfo(null);
      }
    };
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchUser());
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPois = async () => {
      const { data } = await supabase.from("pois").select("*").order("created_at", { ascending: false });
      if (data) { setPois(data); setFilteredPois(data); }
      setLoading(false);
    };
    fetchPois();
  }, []);

  useEffect(() => {
    let result = pois;
    if (activeFilter !== "todos") result = result.filter((p) => p.categoria === activeFilter);
    if (soloAbiertos) result = result.filter((p) => isOpenNow(p));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q));
    }
    setFilteredPois(result);
  }, [activeFilter, searchQuery, pois, soloAbiertos]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({ container: mapContainer.current, style: "mapbox://styles/mapbox/light-v11", center: [-99.1332, 19.4326], zoom: 11.5 });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), "top-right");
    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUbicacionUsuario([pos.coords.latitude, pos.coords.longitude]); },
      () => { setUbicacionUsuario([19.4326, -99.1332]); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const togglePoiEnRuta = useCallback((poi: POI) => {
    setPoisEnRuta((prev) => {
      const exists = prev.find((p) => p.id === poi.id);
      if (exists) return prev.filter((p) => p.id !== poi.id);
      if (prev.length >= 10) return prev;
      return [...prev, poi];
    });
    setRutas([]); setMostrarItinerario(false); setRutaError("");
  }, []);

  const handleSelectPoi = useCallback((poi: POI) => {
    setSelectedPoi(poi);
    if (mapRef.current) mapRef.current.flyTo({ center: [poi.longitud, poi.latitud], zoom: 14, duration: 1000 });
  }, []);

  const calcularRuta = async () => {
    if (poisEnRuta.length < 2) { setRutaError(t("errorMinPuntos")); return; }
    setCalculando(true); setRutaError(""); setRutaAccesible(null); setRutaVehiculo(null);
    const optimizados = optimizarOrdenTSP(poisEnRuta, ubicacionUsuario ?? undefined);
    const puntosParaAPI: PuntoRuta[] = ubicacionUsuario
      ? [{ latitud: ubicacionUsuario[0], longitud: ubicacionUsuario[1], nombre: t("tuUbicacion") }, ...optimizados]
      : optimizados;
    const cacheKey = getCacheKey(optimizados, locale);
    const cached = getRouteCache(cacheKey);
    try {
      let rutasCaminando: RutaGeo[];
      if (cached) { rutasCaminando = cached; }
      else {
        rutasCaminando = await obtenerRutasMapbox(puntosParaAPI, locale, "caminando");
        if (!rutasCaminando.length) { setRutaError(t("errorConexion")); setCalculando(false); return; }
        setRouteCache(cacheKey, rutasCaminando);
      }
      setPoisEnRuta(optimizados); setRutas(rutasCaminando); setRutaSeleccionada(0); setMostrarItinerario(true);
      setMobileSheetOpen(false);
      if (modoAccesible) {
        obtenerRutasMapbox(puntosParaAPI, locale, "accesible")
          .then((data) => { if (data[0]) setRutaAccesible(data[0]); })
          .catch(() => {});
      }
      if (modoVehiculo) {
        obtenerRutasMapbox(puntosParaAPI, locale, "vehiculo")
          .then((data) => { if (data[0]) setRutaVehiculo(data[0]); })
          .catch(() => {});
      }
    } catch { setRutaError(t("errorConexion")); }
    setCalculando(false);
  };

  const limpiarRuta = () => {
    setPoisEnRuta([]); setRutas([]); setRutaAccesible(null); setRutaVehiculo(null); setMostrarItinerario(false); setRutaError("");
    if (mapRef.current) {
      for (let i = 0; i < 3; i++) {
        ["glow", "base", "dash"].forEach((type) => { const id = `route-${i}-${type}`; if (mapRef.current!.getLayer(id)) mapRef.current!.removeLayer(id); });
        const srcId = `route-source-${i}`; if (mapRef.current!.getSource(srcId)) mapRef.current!.removeSource(srcId);
      }
      ["accesible", "vehiculo"].forEach((modo) => {
        ["glow", "base"].forEach((type) => { const id = `route-${modo}-${type}`; if (mapRef.current!.getLayer(id)) mapRef.current!.removeLayer(id); });
        const srcId = `route-source-${modo}`; if (mapRef.current!.getSource(srcId)) mapRef.current!.removeSource(srcId);
      });
    }
  };

  const guardarRuta = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRutaError(t("loginParaGuardar")); return; }
    if (poisEnRuta.length < 2 || rutas.length === 0) return;
    setGuardando(true); setGuardadoMsg("");
    const rutaActiva = rutas[rutaSeleccionada];
    const nombre = poisEnRuta.map((p) => p.nombre).join(" → ");
    const { error } = await supabase.from("rutas_guardadas").insert({
      usuario_id: user.id, nombre, pois_ids: poisEnRuta.map((p) => p.id),
      pois_data: poisEnRuta.map((p) => ({ id: p.id, nombre: p.nombre, emoji: p.emoji, categoria: p.categoria })),
      distancia_texto: rutaActiva.distancia_texto, duracion_texto: rutaActiva.duracion_texto,
    });
    setGuardando(false);
    if (error) { setGuardadoMsg(t("errorGeneric")); } else { setGuardadoMsg(t("rutaGuardada")); setTimeout(() => setGuardadoMsg(""), 3000); }
  };

  const cargarRutasGuardadas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("rutas_guardadas").select("*").eq("usuario_id", user.id).order("created_at", { ascending: false });
    if (data) setRutasGuardadas(data);
    setMostrarGuardadas(true);
  };

  const eliminarRutaGuardada = async (id: string) => {
    await supabase.from("rutas_guardadas").delete().eq("id", id);
    setRutasGuardadas((prev) => prev.filter((r) => r.id !== id));
  };

  const cargarRutaEnMapa = (ruta: any) => {
    const poisIds: string[] = ruta.pois_ids;
    const poisParaRuta = poisIds.map((id: string) => pois.find((p) => p.id === id)).filter(Boolean) as POI[];
    if (poisParaRuta.length < 2) { setRutaError(t("errorGeneric")); return; }
    setPoisEnRuta(poisParaRuta); setRutas([]); setMostrarItinerario(false); setMostrarGuardadas(false);
  };

  const copiarItinerario = () => {
    if (poisEnRuta.length === 0 || rutas.length === 0) return;
    const rutaActiva = rutas[rutaSeleccionada];
    const horas = calcularHorasLlegada(poisEnRuta, rutaActiva);
    let texto = `🗺️ MUUL — ${t("itinerario")}\n📏 ${rutaActiva.distancia_texto} · ⏱ ${rutaActiva.duracion_texto}\n\n`;
    poisEnRuta.forEach((poi, i) => {
      texto += `${i + 1}. ${poi.emoji || "📍"} ${poi.nombre}\n   🕐 ~${horas[i]} · ⏱ ${DURACION_VISITA[poi.categoria] || 30} min\n`;
    });
    texto += `\n🏟️ Muul — ${t("marcaEvento")}`;
    navigator.clipboard.writeText(texto).then(() => { setGuardadoMsg(t("copiadoPortapapeles")); setTimeout(() => setGuardadoMsg(""), 3000); });
  };

  const descargarImagen = async () => {
    if (!itinerarioRef.current) return;
    setGuardadoMsg(t("generandoImagen"));
    try {
      const canvas = await html2canvas(itinerarioRef.current, { backgroundColor: "#f8f9ff", scale: 2 });
      const link = document.createElement("a");
      link.download = `muul-ruta-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setGuardadoMsg(t("imagenDescargada")); setTimeout(() => setGuardadoMsg(""), 3000);
    } catch { setGuardadoMsg(t("errorGeneric")); setTimeout(() => setGuardadoMsg(""), 3000); }
  };

  const compartirRuta = async () => {
    if (poisEnRuta.length === 0 || rutas.length === 0) return;
    const rutaActiva = rutas[rutaSeleccionada];
    const nombres = poisEnRuta.map((p) => `${p.emoji || "📍"} ${p.nombre}`).join(" → ");
    if (navigator.share) {
      try { await navigator.share({ title: "Muul", text: `🗺️ ${nombres}\n📏 ${rutaActiva.distancia_texto} · ⏱ ${rutaActiva.duracion_texto}` }); } catch {}
    } else { copiarItinerario(); }
  };

  // ── Render markers ──
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    filteredPois.forEach((poi) => {
      const isInRouteFlag = poisEnRuta.some((p) => p.id === poi.id);
      const routeIndex = poisEnRuta.findIndex((p) => p.id === poi.id);
      const color = getMarkerColor(poi.categoria);
      const wrapper = document.createElement("div");
      const circle = document.createElement("div");
      circle.style.cssText = `width:40px;height:40px;border-radius:50%;background:#ffffff;border:3px solid ${isInRouteFlag ? "#98d5a2" : color};display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;box-shadow:${isInRouteFlag ? "0 0 16px rgba(152,213,162,0.5)" : "0 4px 12px rgba(0,0,0,0.4)"};transition:transform 0.2s;position:relative;`;
      circle.innerHTML = `<span style="pointer-events:none;">${poi.emoji || "📍"}</span>`;
      if (isInRouteFlag && routeIndex >= 0) {
        const badge = document.createElement("div");
        badge.style.cssText = `position:absolute;top:-8px;right:-8px;width:20px;height:20px;border-radius:50%;background:#003e6f;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;border:2px solid #ffffff;z-index:10;pointer-events:none;`;
        badge.textContent = String(routeIndex + 1);
        circle.appendChild(badge);
      }
      circle.addEventListener("mouseenter", () => { circle.style.transform = "scale(1.3)"; });
      circle.addEventListener("mouseleave", () => { circle.style.transform = "scale(1)"; });
      circle.addEventListener("click", () => handleSelectPoi(poi));
      wrapper.appendChild(circle);
      const marker = new mapboxgl.Marker({ element: wrapper, anchor: "center" }).setLngLat([poi.longitud, poi.latitud]).addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
    if (ubicacionUsuario && mapRef.current) {
      const userEl = document.createElement("div");
      const userDot = document.createElement("div");
      userDot.style.cssText = `width:20px;height:20px;border-radius:50%;background:#003e6f;border:3px solid #ffffff;box-shadow:0 0 12px rgba(96,165,250,0.6);`;
      const userPulse = document.createElement("div");
      userPulse.style.cssText = `position:absolute;top:-6px;left:-6px;width:32px;height:32px;border-radius:50%;background:rgba(96,165,250,0.3);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;`;
      userEl.style.cssText = `position:relative;width:20px;height:20px;`;
      userEl.appendChild(userPulse);
      userEl.appendChild(userDot);
      const userMarker = new mapboxgl.Marker({ element: userEl, anchor: "center" }).setLngLat([ubicacionUsuario[1], ubicacionUsuario[0]]).addTo(mapRef.current);
      markersRef.current.push(userMarker);
    }
  }, [filteredPois, mapLoaded, poisEnRuta, handleSelectPoi]);

  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Cancel any running animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Clean up previous layers/sources
    for (let i = 0; i < 3; i++) {
      ["glow", "base", "dash"].forEach((type) => {
        const id = `route-${i}-${type}`;
        if (mapRef.current!.getLayer(id)) mapRef.current!.removeLayer(id);
      });
      const srcId = `route-source-${i}`;
      if (mapRef.current!.getSource(srcId)) mapRef.current!.removeSource(srcId);
    }

    rutas.forEach((ruta, i) => {
      const srcId = `route-source-${i}`;
      const isActive = i === rutaSeleccionada;
      const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
      mapRef.current!.addSource(srcId, { type: "geojson", data: { type: "Feature", properties: {}, geometry: ruta.geometry } });
      mapRef.current!.addLayer({ id: `route-${i}-glow`, type: "line", source: srcId, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": color, "line-width": isActive ? 14 : 8, "line-opacity": isActive ? 0.2 : 0.05, "line-blur": 8 } });
      mapRef.current!.addLayer({ id: `route-${i}-base`, type: "line", source: srcId, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": color, "line-width": isActive ? 5 : 3, "line-opacity": isActive ? 0.9 : 0.3 } });
      if (isActive) {
        mapRef.current!.addLayer({
          id: `route-${i}-dash`,
          type: "line",
          source: srcId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#ffffff", "line-width": 2, "line-opacity": 0.6, "line-dasharray": [0, 4, 3] },
        });
      }
    });

    if (rutas.length > 0 && rutas[rutaSeleccionada]) {
      const coords = rutas[rutaSeleccionada].geometry.coordinates;
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c: any) => bounds.extend(c as [number, number]));
      mapRef.current!.fitBounds(bounds, { padding: 80, duration: 1000 });
    }

    // Animate the dash on the active route
    const dashSteps = [
      [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
      [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 3, 3],
    ];
    let step = 0;
    let lastTime = 0;
    const STEP_MS = 80;

    const animate = (timestamp: number) => {
      if (!mapRef.current) return;
      if (timestamp - lastTime >= STEP_MS) {
        const activeLayerId = `route-${rutaSeleccionada}-dash`;
        if (mapRef.current.getLayer(activeLayerId)) {
          mapRef.current.setPaintProperty(activeLayerId, "line-dasharray", dashSteps[step]);
        }
        step = (step + 1) % dashSteps.length;
        lastTime = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    if (rutas.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [rutas, rutaSeleccionada, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const modosData: { id: string; ruta: RutaGeo | null; color: string }[] = [
      { id: "accesible", ruta: rutaAccesible, color: "#60a5fa" },
      { id: "vehiculo", ruta: rutaVehiculo, color: "#facc15" },
    ];

    // Separate animation refs for each mode
    const modeAnimRefs: Record<string, number> = {};

    modosData.forEach(({ id: modo, ruta, color }) => {
      ["glow", "base", "dash"].forEach((type) => {
        const layerId = `route-${modo}-${type}`;
        if (mapRef.current!.getLayer(layerId)) mapRef.current!.removeLayer(layerId);
      });
      const srcId = `route-source-${modo}`;
      if (mapRef.current!.getSource(srcId)) mapRef.current!.removeSource(srcId);
      if (!ruta) return;

      mapRef.current!.addSource(srcId, { type: "geojson", data: { type: "Feature", properties: {}, geometry: ruta.geometry } });
      mapRef.current!.addLayer({ id: `route-${modo}-glow`, type: "line", source: srcId, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": color, "line-width": 10, "line-opacity": 0.15, "line-blur": 6 } });
      mapRef.current!.addLayer({ id: `route-${modo}-base`, type: "line", source: srcId, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": color, "line-width": 4, "line-opacity": 0.8, "line-dasharray": [0, 4, 3] } });

      // Animate dash for this mode layer
      const dashSteps = [
        [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
        [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 3, 3],
      ];
      let step = 0;
      let lastTime = 0;
      const STEP_MS = 100;

      const animateMode = (timestamp: number) => {
        if (!mapRef.current) return;
        if (timestamp - lastTime >= STEP_MS) {
          const layerId = `route-${modo}-base`;
          if (mapRef.current.getLayer(layerId)) {
            mapRef.current.setPaintProperty(layerId, "line-dasharray", dashSteps[step]);
          }
          step = (step + 1) % dashSteps.length;
          lastTime = timestamp;
        }
        modeAnimRefs[modo] = requestAnimationFrame(animateMode);
      };

      modeAnimRefs[modo] = requestAnimationFrame(animateMode);
    });

    return () => {
      Object.values(modeAnimRefs).forEach((id) => cancelAnimationFrame(id));
    };
  }, [rutaAccesible, rutaVehiculo, mapLoaded]);

  const formatHours = (poi: POI) => {
    if (!poi.horario_apertura || !poi.horario_cierre) return t("horarioNoDisponible");
    return `${t("abierto")} · ${t("cierra", { hora: poi.horario_cierre })}`;
  };
  const isInRoute = (poi: POI) => poisEnRuta.some((p) => p.id === poi.id);

  return (
    <div className="h-screen flex flex-col overflow-hidden pt-[80px] bg-surface text-on-surface font-body">

      {/* ═══ MAIN ═══ */}
      <main className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar icon rail */}
        <aside className="hidden md:flex flex-col h-full w-20 bg-surface-container-low space-y-8 py-8 items-center border-r border-outline-variant/10">
          <Link href="/" className="w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest/50 transition-all"><span className="">🔍</span></Link>
          <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-container-highest text-secondary shadow-lg shadow-secondary/10"><span className="" style={{ fontVariationSettings: "'FILL' 1" }}>🗺️</span></button>
          <button onClick={cargarRutasGuardadas} className="w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest/50 transition-all"><span className="">🔖</span></button>
        </aside>

        <div className="flex-1 flex overflow-hidden">

          {/* ── Desktop panel ── */}
          <div className="hidden md:flex w-[360px] flex-col bg-surface-container-lowest relative z-30 border-r border-outline-variant/10">
            {!mostrarItinerario ? (
              <>
                <div className="p-6 space-y-4">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">🔎</span>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("buscar")} className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40 transition-all" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {filters.map((f) => (
                      <button key={f.value} onClick={() => setActiveFilter(f.value)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${activeFilter === f.value ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface hover:bg-surface-bright"}`}>{f.label} <span className="text-xs">{f.emoji}</span></button>
                    ))}
                    <button onClick={() => setSoloAbiertos(!soloAbiertos)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${soloAbiertos ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface hover:bg-surface-bright"}`}>
                      <span className="text-sm">⏰</span>{t("abiertos")}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2" style={{ scrollbarWidth: "none" }}>
                  {loading ? (
                    <div className="space-y-3 p-4">{[1,2,3].map((i) => (<div key={i} className="animate-pulse flex gap-4 p-4"><div className="w-12 h-12 rounded-xl bg-surface-container-high" /><div className="flex-1 space-y-2"><div className="h-4 bg-surface-container-high rounded w-3/4" /><div className="h-3 bg-surface-container-high rounded w-1/2" /></div></div>))}</div>
                  ) : filteredPois.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-12 px-4 space-y-3"><span className="text-4xl">🔍</span><p className="text-on-surface-variant text-sm">{t("sinResultados")}</p></div>
                  ) : (
                    filteredPois.map((poi) => {
                      const inRoute = isInRoute(poi);
                      const routeNum = poisEnRuta.findIndex((p) => p.id === poi.id) + 1;
                      return (
                        <div key={poi.id} className={`p-4 rounded-xl flex items-start gap-4 transition-all ${selectedPoi?.id === poi.id ? "bg-surface-container-high border-l-4 border-secondary" : "hover:bg-surface-container-high"}`}>
                          <button onClick={() => handleSelectPoi(poi)} className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl shadow-inner shrink-0">{poi.emoji || "📍"}</button>
                          <button onClick={() => handleSelectPoi(poi)} className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-headline font-bold text-on-surface truncate">{poi.nombre}</h3>
                              {poi.verificado && (<span className="text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5"><span className="text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>✅</span>Muul</span>)}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5"><span className={isOpenNow(poi) ? "text-secondary" : "text-tertiary"}>● </span>{formatHours(poi)}</p>
                          </button>
                          <button onClick={() => togglePoiEnRuta(poi)} className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all ${inRoute ? "bg-secondary text-on-secondary shadow-glow-secondary" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"}`}>
                            {inRoute ? routeNum : <span className="text-lg">📍</span>}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 space-y-3">
                  {rutaError && (<div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium animate-fade-in-up">{rutaError}</div>)}
                  <button onClick={() => { if (selectedPoi) setChatbotAbierto(true); }} disabled={!selectedPoi}
                    className="w-full mb-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary-container/20 text-primary border border-primary/20 font-headline font-bold text-sm transition-all hover:bg-primary-container/30 disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="text-lg">✨</span>
                    {selectedPoi ? t("preguntarAI", { nombre: selectedPoi.nombre }) : t("seleccionaPrimero")}
                  </button>
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${poisEnRuta.length > 0 ? "bg-secondary animate-pulse" : "bg-on-surface-variant"}`} />
                      <span className="text-sm font-bold text-on-surface">{poisEnRuta.length === 1 ? t("paradas", { count: 1 }) : t("paradasPlural", { count: poisEnRuta.length })}</span>
                    </div>
                    {poisEnRuta.length > 0 && (<button onClick={limpiarRuta} className="text-xs text-on-surface-variant hover:text-tertiary transition-colors font-bold">{t("limpiar")}</button>)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModoAccesible(!modoAccesible)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${modoAccesible ? "bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/30" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"}`}>
                      <span className="text-sm">♿</span>{t("accesible")}
                    </button>
                    <button onClick={() => setModoVehiculo(!modoVehiculo)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${modoVehiculo ? "bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/30" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"}`}>
                      <span className="text-sm">🚗</span>{t("vehiculo")}
                    </button>
                  </div>
                  <button onClick={calcularRuta} disabled={poisEnRuta.length < 2 || calculando} className="w-full bg-secondary hover:bg-secondary-fixed text-on-secondary py-4 rounded-xl font-headline font-black uppercase tracking-widest transition-all shadow-lg shadow-secondary/10 disabled:opacity-40 disabled:cursor-not-allowed">
                    {calculando ? t("calculando") : t("calcularRuta")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div ref={itinerarioRef} className="flex flex-col flex-1 overflow-hidden bg-surface-container-lowest">
                  <div className="p-6 border-b border-outline-variant/10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-headline font-black text-on-surface text-sm uppercase tracking-widest">{t("itinerario")}</h2>
                      <button onClick={() => setMostrarItinerario(false)} className="text-xs text-on-surface-variant hover:text-on-surface font-bold flex items-center gap-1 transition-colors">
                        <span className="text-sm">←</span> {t("volver")}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {rutas.map((ruta, i) => (
                        <button key={i} onClick={() => setRutaSeleccionada(i)} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${rutaSeleccionada === i ? "bg-surface-container-high border border-secondary/30" : "bg-surface-container-low hover:bg-surface-container-high border border-transparent"}`}>
                          <div className="w-3 h-3 rounded-full" style={{ background: ROUTE_COLORS[i] }} />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-on-surface">{i === 0 ? t("rutaPrincipal") : t("alternativa", { num: i })}</p>
                            <p className="text-[10px] text-on-surface-variant">
                              {ruta.distancia_texto} · {ruta.duracion_texto} {t("caminando")} · {t("totalConVisitas", { min: Math.round(ruta.duracion_segundos / 60 + poisEnRuta.reduce((acc, p) => acc + (DURACION_VISITA[p.categoria] || 30), 0)) })}
                            </p>
                          </div>
                          {i === 0 && <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded uppercase">{t("optima")}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(rutaAccesible || rutaVehiculo) && (
                    <div className="px-6 py-4 border-b border-outline-variant/10 space-y-2">
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t("comparacion")}</h3>
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/10">
                        <div className="w-3 h-3 rounded-full bg-[#98d5a2]" />
                        <span className="text-xs font-bold text-on-surface flex-1">{t("caminandoIcon")}</span>
                        <span className="text-xs text-on-surface-variant">{rutas[rutaSeleccionada]?.duracion_texto}</span>
                      </div>
                      {rutaAccesible && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-[#60a5fa]/10">
                          <div className="w-3 h-3 rounded-full bg-[#60a5fa]" />
                          <span className="text-xs font-bold text-on-surface flex-1">{t("accesibleIcon")}</span>
                          <span className="text-xs text-on-surface-variant">{rutaAccesible.distancia_texto} · {rutaAccesible.duracion_texto}</span>
                        </div>
                      )}
                      {rutaVehiculo && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-[#facc15]/10">
                          <div className="w-3 h-3 rounded-full bg-[#facc15]" />
                          <span className="text-xs font-bold text-on-surface flex-1">{t("vehiculoIcon")}</span>
                          <span className="text-xs text-on-surface-variant">{rutaVehiculo.distancia_texto} · {rutaVehiculo.duracion_texto}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6 border-b border-outline-variant/10">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">{t("paradasTitulo")}</h3>
                    <div className="space-y-4 relative">
                      <div className="absolute left-[11px] top-4 bottom-4 w-px bg-outline-variant/30" />
                      {ubicacionUsuario && (
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/20">
                            <span className="text-secondary text-[12px]">📍</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-on-surface font-medium block">{t("tuUbicacion")}</span>
                            <span className="text-[10px] text-secondary">{t("puntoPartida")}</span>
                          </div>
                          <span className="text-lg">📍</span>
                        </div>
                      )}
                      {poisEnRuta.map((poi, i) => (
                        <div key={poi.id} className="flex items-center gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black bg-surface-container-highest" style={{ borderColor: ROUTE_COLORS[rutaSeleccionada % ROUTE_COLORS.length] }}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-on-surface font-medium truncate block">{poi.nombre}</span>
                            <span className="text-[10px] text-on-surface-variant">{t("llegada", { hora: calcularHorasLlegada(poisEnRuta, rutas[rutaSeleccionada])[i] })} · {t("minVisita", { min: DURACION_VISITA[poi.categoria] || 30 })}</span>
                          </div>
                          <span className="text-lg">{poi.emoji}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 space-y-3">
                  {guardadoMsg && (<p className={`text-xs font-bold text-center animate-fade-in-up ${guardadoMsg.includes("Error") ? "text-error" : "text-secondary"}`}>{guardadoMsg}</p>)}
                  <div className="relative">
                    <button
                      onClick={() => setCompartirMenuOpen((v) => !v)}
                      className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-surface-bright transition-all uppercase tracking-wider"
                    >
                      <span className="text-sm">🔗</span>
                      {t("compartir")}
                    </button>
                    {compartirMenuOpen && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        <button onClick={() => { copiarItinerario(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface">
                          <span className="text-base">📋</span>{t("copiar")}
                        </button>
                        <button onClick={() => { descargarImagen(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface">
                          <span className="text-base">⬇️</span>{t("imagen")}
                        </button>
                        <button onClick={() => { compartirRuta(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface">
                          <span className="text-base">↗</span>{t("compartirApps")}
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={guardarRuta} disabled={guardando} className="w-full bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="text-sm">🔖</span>{guardando ? t("guardando") : t("guardarRuta")}
                  </button>
                  <button onClick={limpiarRuta} className="w-full border border-tertiary/30 text-tertiary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:bg-tertiary/10 transition-all">{t("nuevaRuta")}</button>
                </div>
              </>
            )}
          </div>

          {/* ── Map area ── */}
          <div className="flex-1 relative overflow-hidden">
            <div ref={mapContainer} className="absolute inset-0" />

            {/* POI popup — desktop centered, mobile compact above sheet */}
            {selectedPoi && !mostrarItinerario && (
              <div className="absolute bottom-[180px] md:bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[340px] bg-surface-bright/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 md:p-5 border border-white/5 z-50 animate-fade-in-up">
                <div className="flex gap-3 mb-2 md:mb-3">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl md:text-3xl shadow-inner shrink-0">{selectedPoi.emoji || "📍"}</div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-headline font-extrabold text-on-surface text-base md:text-lg leading-tight truncate">{selectedPoi.nombre}</h4>
                    <p className="text-secondary text-xs font-bold mt-0.5"><span className={isOpenNow(selectedPoi) ? "text-secondary" : "text-tertiary"}>● </span>{formatHours(selectedPoi)}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[9px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded font-black uppercase">{selectedPoi.categoria}</span>
                      {selectedPoi.precio_rango && <span className="text-[9px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded font-black uppercase">{selectedPoi.precio_rango}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedPoi(null)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-colors">
                    <span className="text-sm">✕</span>
                  </button>
                </div>
                {selectedPoi.descripcion && <p className="text-xs text-on-surface-variant leading-relaxed mb-3 line-clamp-2 hidden md:block">{selectedPoi.descripcion}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePoiEnRuta(selectedPoi)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${isInRoute(selectedPoi) ? "bg-tertiary/20 text-tertiary border border-tertiary/30" : "bg-secondary text-on-secondary"}`}
                  >
                    {isInRoute(selectedPoi) ? t("quitarRuta") : t("agregarRuta")}
                  </button>
                  <button
                    onClick={() => { setChatbotAbierto(true); setMobileSheetOpen(false); }}
                    className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-primary-container/30 text-primary border border-primary/20 flex items-center justify-center gap-1 transition-all hover:bg-primary-container/40"
                  >
                    <span className="text-sm">✨</span>
                    <span className="hidden sm:inline">{t("muulAi")}</span>
                    <span className="sm:hidden">AI</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Rutas guardadas modal ── */}
        {mostrarGuardadas && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm" onClick={() => setMostrarGuardadas(false)} />
            <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-outline-variant/10 animate-fade-in-up">
              <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
                <h2 className="font-headline font-black text-on-surface text-sm uppercase tracking-widest">{t("misRutas")}</h2>
                <button onClick={() => setMostrarGuardadas(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors"><span className="text-on-surface-variant">✕</span></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
                {rutasGuardadas.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-12 space-y-3"><span className="text-4xl">🗺️</span><p className="text-on-surface-variant text-sm">{t("sinRutas")}</p></div>
                ) : (
                  rutasGuardadas.map((ruta) => (
                    <div key={ruta.id} className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-1 mb-1">{ruta.pois_data?.map((p: any, i: number) => (<span key={i} className="text-lg">{p.emoji}</span>))}</div>
                          <p className="text-xs text-on-surface font-bold truncate">{ruta.nombre}</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">{ruta.distancia_texto} · {ruta.duracion_texto}</p>
                        </div>
                        <button onClick={() => eliminarRutaGuardada(ruta.id)} className="text-on-surface-variant hover:text-tertiary transition-colors shrink-0"><span className="text-sm">🗑️</span></button>
                      </div>
                      <button onClick={() => cargarRutaEnMapa(ruta)} className="w-full bg-secondary text-on-secondary py-2.5 rounded-lg text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all">{t("cargarMapa")}</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <ChatModal isOpen={chatbotAbierto} onClose={() => setChatbotAbierto(false)} poi={selectedPoi} idioma={locale} />
      </main>

      {/* ═══ MOBILE BOTTOM SHEET ═══ */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-[60px] z-40 bg-surface-container-low rounded-t-2xl shadow-2xl border-t border-outline-variant/10 flex flex-col transition-all duration-300 ease-in-out ${
          mobileSheetOpen ? "h-[72vh]" : "h-[160px]"
        }`}
      >
        {/* Drag handle */}
        <button
          onClick={() => setMobileSheetOpen((v) => !v)}
          className="flex flex-col items-center pt-3 pb-2 w-full shrink-0"
          aria-label={mobileSheetOpen ? t("cerrarPanel") : t("abrirPanel")}
        >
          <div className="w-10 h-1 rounded-full bg-outline-variant mb-2" />
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant text-sm">
              {mobileSheetOpen ? "⌄" : "⌃"}
            </span>
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest">
              {mobileSheetOpen ? t("cerrar") : mostrarItinerario ? t("itinerario") : t("explorar")}
            </span>
            {poisEnRuta.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-secondary text-on-secondary text-[10px] font-black flex items-center justify-center">
                {poisEnRuta.length}
              </span>
            )}
          </div>
        </button>

        {/* Search + filters — always visible */}
        <div className="px-4 pb-3 space-y-2 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">🔎</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (!mobileSheetOpen) setMobileSheetOpen(true); }}
              placeholder={t("buscar")}
              className="w-full bg-surface-container-highest border-none rounded-xl py-3 pl-10 pr-4 text-on-surface text-sm placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setActiveFilter(f.value); if (!mobileSheetOpen) setMobileSheetOpen(true); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                  activeFilter === f.value ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface"
                }`}
              >
                {f.label} <span>{f.emoji}</span>
              </button>
            ))}
            <button
              onClick={() => { setSoloAbiertos(!soloAbiertos); if (!mobileSheetOpen) setMobileSheetOpen(true); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                soloAbiertos ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface"
              }`}
            >
              <span className="text-sm">⏰</span>
              {t("abiertos")}
            </button>
          </div>
        </div>

        {/* POI list + route controls — only when expanded */}
        {mobileSheetOpen && (
          <>
            {mostrarItinerario ? (
              /* ── Mobile itinerary view ── */
              <>
                <div className="flex-1 overflow-y-auto px-4 space-y-3" style={{ scrollbarWidth: "none" }}>
                  {/* Route selector */}
                  <div className="space-y-2">
                    {rutas.map((ruta, i) => (
                      <button key={i} onClick={() => setRutaSeleccionada(i)} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${rutaSeleccionada === i ? "bg-surface-container-high border border-secondary/30" : "bg-surface-container-low border border-transparent"}`}>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ROUTE_COLORS[i] }} />
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-on-surface">{i === 0 ? t("rutaPrincipal") : t("alternativa", { num: i })}</p>
                          <p className="text-[10px] text-on-surface-variant">{ruta.distancia_texto} · {ruta.duracion_texto}</p>
                        </div>
                        {i === 0 && <span className="text-[9px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded uppercase">{t("optima")}</span>}
                      </button>
                    ))}
                  </div>
                  {/* Stops */}
                  <div className="space-y-3 relative pt-1">
                    <div className="absolute left-[11px] top-4 bottom-4 w-px bg-outline-variant/30" />
                    {ubicacionUsuario && (
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/20 shrink-0">
                          <span className="text-secondary text-[12px]">📍</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-on-surface font-medium block">{t("tuUbicacion")}</span>
                          <span className="text-[10px] text-secondary">{t("puntoPartida")}</span>
                        </div>
                      </div>
                    )}
                    {poisEnRuta.map((poi, i) => (
                      <div key={poi.id} className="flex items-center gap-3 relative z-10">
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black bg-surface-container-highest shrink-0" style={{ borderColor: ROUTE_COLORS[rutaSeleccionada % ROUTE_COLORS.length] }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-on-surface font-medium truncate block">{poi.nombre}</span>
                          <span className="text-[10px] text-on-surface-variant">{t("llegada", { hora: calcularHorasLlegada(poisEnRuta, rutas[rutaSeleccionada])[i] })} · {t("minVisita", { min: DURACION_VISITA[poi.categoria] || 30 })}</span>
                        </div>
                        <span className="text-lg shrink-0">{poi.emoji}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile itinerary actions */}
                <div className="px-4 pb-4 pt-3 border-t border-outline-variant/10 space-y-2 shrink-0">
                  {guardadoMsg && <p className={`text-xs font-bold text-center ${guardadoMsg.includes("Error") ? "text-error" : "text-secondary"}`}>{guardadoMsg}</p>}
                  <div className="relative">
                    <button
                      onClick={() => setCompartirMenuOpen((v) => !v)}
                      className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-bright transition-all uppercase tracking-wider"
                    >
                      <span className="text-sm">🔗</span>
                      {t("compartir")}
                    </button>
                    {compartirMenuOpen && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        <button onClick={() => { copiarItinerario(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface">
                          <span className="text-base">📋</span>{t("copiar")}
                        </button>
                        <button onClick={() => { descargarImagen(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface">
                          <span className="text-base">⬇️</span>{t("imagen")}
                        </button>
                        <button onClick={() => { compartirRuta(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface">
                          <span className="text-base">↗</span>{t("compartirApps")}
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={guardarRuta} disabled={guardando} className="w-full bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="text-sm">🔖</span>
                    {guardando ? t("guardando") : t("guardarRuta")}
                  </button>
                  <button onClick={limpiarRuta} className="w-full border border-tertiary/30 text-tertiary py-2.5 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:bg-tertiary/10 transition-all">
                    {t("nuevaRuta")}
                  </button>
                </div>
              </>
            ) : (
              /* ── Mobile POI list + route builder ── */
              <>
            <div className="flex-1 overflow-y-auto px-4 space-y-2" style={{ scrollbarWidth: "none" }}>
              {loading ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-surface-container-high rounded w-3/4" />
                        <div className="h-2 bg-surface-container-high rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPois.length === 0 ? (
                <div className="flex flex-col items-center text-center py-8 space-y-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-on-surface-variant text-xs">{t("sinResultados")}</p>
                </div>
              ) : (
                filteredPois.map((poi) => {
                  const inRoute = isInRoute(poi);
                  const routeNum = poisEnRuta.findIndex((p) => p.id === poi.id) + 1;
                  return (
                    <div
                      key={poi.id}
                      className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                        selectedPoi?.id === poi.id
                          ? "bg-surface-container-high border-l-4 border-secondary"
                          : "hover:bg-surface-container-high"
                      }`}
                    >
                      <button
                        onClick={() => { handleSelectPoi(poi); setMobileSheetOpen(false); }}
                        className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-xl shrink-0"
                      >
                        {poi.emoji || "📍"}
                      </button>
                      <button
                        onClick={() => { handleSelectPoi(poi); setMobileSheetOpen(false); }}
                        className="flex-1 min-w-0 text-left"
                      >
                        <h3 className="font-headline font-bold text-on-surface text-sm truncate">{poi.nombre}</h3>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          <span className={isOpenNow(poi) ? "text-secondary" : "text-tertiary"}>● </span>
                          {formatHours(poi)}
                        </p>
                      </button>
                      <button
                        onClick={() => togglePoiEnRuta(poi)}
                        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                          inRoute ? "bg-secondary text-on-secondary" : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {inRoute ? routeNum : <span className="text-base">📍</span>}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Route controls */}
            <div className="px-4 pb-4 pt-3 border-t border-outline-variant/10 space-y-2 shrink-0">
              {rutaError && (
                <div className="p-2 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium">
                  {rutaError}
                </div>
              )}
              <button
                onClick={() => { if (selectedPoi) { setChatbotAbierto(true); setMobileSheetOpen(false); } }}
                disabled={!selectedPoi}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary-container/20 text-primary border border-primary/20 font-headline font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="text-base">✨</span>
                {selectedPoi ? t("preguntarAI", { nombre: selectedPoi.nombre }) : t("seleccionaPrimero")}
              </button>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${poisEnRuta.length > 0 ? "bg-secondary animate-pulse" : "bg-on-surface-variant"}`} />
                  <span className="text-xs font-bold text-on-surface">
                    {poisEnRuta.length === 1 ? t("paradas", { count: 1 }) : t("paradasPlural", { count: poisEnRuta.length })}
                  </span>
                </div>
                {poisEnRuta.length > 0 && (
                  <button onClick={limpiarRuta} className="text-xs text-on-surface-variant hover:text-tertiary font-bold">
                    {t("limpiar")}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModoAccesible(!modoAccesible)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${modoAccesible ? "bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/30" : "bg-surface-container-highest text-on-surface-variant"}`}
                >
                  <span className="text-sm">♿</span>{t("accesible")}
                </button>
                <button
                  onClick={() => setModoVehiculo(!modoVehiculo)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${modoVehiculo ? "bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/30" : "bg-surface-container-highest text-on-surface-variant"}`}
                >
                  <span className="text-sm">🚗</span>{t("vehiculo")}
                </button>
              </div>
              <button
                onClick={calcularRuta}
                disabled={poisEnRuta.length < 2 || calculando}
                className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-headline font-black text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {calculando ? t("calculando") : t("calcularRuta")}
              </button>
            </div>
          </>
            )}
          </>
        )}
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant/10 py-3 z-50">
        <div className="flex justify-around items-center px-6">
          <Link href="/" className="flex flex-col items-center gap-1 text-on-surface-variant">
            <span className="">🔍</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tn("explorar")}</span>
          </Link>
          <button
            onClick={() => setMobileSheetOpen((v) => !v)}
            className="flex flex-col items-center gap-1 text-secondary"
          >
            <span className="" style={{ fontVariationSettings: "'FILL' 1" }}>🗺️</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tn("mapa")}</span>
          </button>
          <Link href="/perfil" className="flex flex-col items-center gap-1 text-on-surface-variant">
            <span className="">👤</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tn("perfil")}</span>
          </Link>
        </div>
      </div>

    </div>
  );
}