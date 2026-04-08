"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";
import type { POI } from "@/types/database";
import html2canvas from "html2canvas";
import ChatModal from "@/components/ui/ChatModal";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { applyMuulMapStyle } from "@/lib/mapStyle";

// ── New feature hooks & components ──
import { useMapboxOptimization, type TransportMode } from "@/hooks/useMapboxOptimization";
import { usePartyMode } from "@/hooks/usePartyMode";
import { useSorprendeme } from "@/hooks/useSorprendeme";
import TransportSelector, { getRouteColorForMode } from "@/components/map/TransportSelector";
import POICard from "@/components/map/POICard";
import PartyModeModal from "@/components/map/PartyModeModal";
import SorprendemeFAB from "@/components/map/SorprendemeFAB";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { haversine } from "@/lib/haversine";
import { useNearbySearch } from "@/hooks/useNearbySearch";


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

/* ── Types ── */
interface UserInfo { initials: string; nombre: string }

/* ── Visit duration by category (minutes) ── */
const DURACION_VISITA: Record<string, number> = {
  cultural: 60, comida: 45, tienda: 30, deportes: 90, servicio: 20,
};

/* ── Helpers ── */
function getMarkerColor(cat: string): string {
  const m: Record<string, string> = {
    comida: "#ffb3b3", cultural: "#b0c6fd", deportes: "#98d5a2",
    tienda: "#8a8a8e", servicio: "#8a8a8e",
  };
  return m[cat] ?? "#8a8a8e";
}

function isOpenNow(poi: POI): boolean {
  if (!poi.horario_apertura || !poi.horario_cierre) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [aH, aM] = poi.horario_apertura.split(":").map(Number);
  const [cH, cM] = poi.horario_cierre.split(":").map(Number);
  const apertura = aH * 60 + (aM || 0);
  const cierre = cH * 60 + (cM || 0);
  if (cierre < apertura) return cur >= apertura || cur <= cierre;
  return cur >= apertura && cur <= cierre;
}

function calcularHorasLlegada(
  poisRuta: POI[],
  duracionSegundos: number
): string[] {
  if (poisRuta.length === 0) return [];
  const ahora = new Date();
  let minAcum = 0;
  return poisRuta.map((poi, i) => {
    if (i > 0) {
      const porLeg = duracionSegundos / 60 / Math.max(poisRuta.length - 1, 1);
      minAcum += porLeg;
    }
    const llegada = new Date(ahora.getTime() + minAcum * 60000);
    minAcum += DURACION_VISITA[poi.categoria] || 30;
    return llegada.toLocaleTimeString("es-MX", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  });
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
  const animationRef = useRef<number | null>(null);
  const t = useTranslations("mapa");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();



  const filters = [
    { label: t("todos"), emoji: "🗺️", value: "todos" },
    { label: t("comida"), emoji: "🍜", value: "comida" },
    { label: t("cultural"), emoji: "🏛️", value: "cultural" },
    { label: t("deportes"), emoji: "⚽", value: "deportes" },
    { label: t("tiendas"), emoji: "🛍️", value: "tienda" },
  ];

  // ── Feature hooks ──
  const mapboxOpt = useMapboxOptimization();
  const partyMode = usePartyMode();
  const sorprendeme = useSorprendeme();
  const { buscarLugarGlobal, buscandoGlobal } = useGlobalSearch(); 
  const { buscarEnMapbox, buscandoExternos } = useNearbySearch();

  // ── State ──
  const [pois, setPois] = useState<POI[]>([]);                    // from Supabase DB
  const [mapboxPois, setMapboxPois] = useState<POI[]>([]);         // from Mapbox fallback
  const poisRef = useRef<POI[]>([]);
  useEffect(() => { poisRef.current = pois; }, [pois]);

  const [filteredPois, setFilteredPois] = useState<POI[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [poisEnRuta, setPoisEnRuta] = useState<POI[]>([]);
  const [mostrarItinerario, setMostrarItinerario] = useState(false);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<[number, number] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoMsg, setGuardadoMsg] = useState("");
  const [rutasGuardadas, setRutasGuardadas] = useState<any[]>([]);
  const [mostrarGuardadas, setMostrarGuardadas] = useState(false);
  const [chatbotAbierto, setChatbotAbierto] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [compartirMenuOpen, setCompartirMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // ── NEW: transport mode ──
  const [transportMode, setTransportMode] = useState<TransportMode>("walking");

  // ── NEW: party mode modal ──
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [savedRouteIdForParty, setSavedRouteIdForParty] = useState<string | undefined>();

  /* ── Auth ── */
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

  /* ── Load POIs from Supabase ── */
  useEffect(() => {
    const fetchPois = async () => {
      const { data } = await supabase.from("pois").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setPois(data);
      }
      // Always set loading false so fallback can trigger
      setLoading(false);
    };
    fetchPois();
  }, []);

  /* ── Handle ?party= URL param on load ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partyId = params.get("party");
    if (partyId) {
      setPartyModalOpen(true);
    }
  }, []);

  /* ── Filter POIs & Sort by Distance ──
     Merges Supabase pois + Mapbox fallback pois, then applies filters.
     When Supabase has data, it takes priority. When it's empty, mapboxPois are used.
  */
  useEffect(() => {
    // Combine sources: DB pois take priority, fallback fills the gap
    const sourcePois = pois.length > 0 ? pois : mapboxPois;
    let result = [...sourcePois];

    if (activeFilter !== "todos") result = result.filter((p) => p.categoria === activeFilter);
    if (soloAbiertos) result = result.filter((p) => isOpenNow(p));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)
      );
    }

    // Sort by proximity if we have user location
    if (ubicacionUsuario) {
      result.sort((a, b) => {
        const distA = haversine(ubicacionUsuario, [a.latitud, a.longitud]);
        const distB = haversine(ubicacionUsuario, [b.latitud, b.longitud]);
        return distA - distB;
      });
    }

    setFilteredPois(result);
  }, [activeFilter, searchQuery, pois, mapboxPois, soloAbiertos, ubicacionUsuario]);

  /* ── Init map ── */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-99.1332, 19.4326],
      zoom: 11.5,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), "top-right");
    map.on("style.load", () => {
      applyMuulMapStyle(map);
    });

    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ── Mapbox fallback: fetch POIs when Supabase DB is empty ──
     Triggers on map load, on map move, and whenever loading finishes.
     Only runs when there are no DB pois.
  */
  useEffect(() => {
    if (!mapLoaded || loading) return;
    // If we have DB pois, no need for Mapbox fallback
    if (pois.length > 0) return;

    const fetchMapboxPois = async () => {
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      const results = await buscarEnMapbox([center.lat, center.lng], zoom);
      if (results.length > 0) {
        setMapboxPois(results);
      }
    };

    // Initial fetch
    fetchMapboxPois();

    // Also fetch when user moves the map
    const onMoveEnd = () => {
      // Re-check: only fetch if still no DB pois
      if (poisRef.current.length === 0) {
        fetchMapboxPois();
      }
    };

    mapRef.current?.on("moveend", onMoveEnd);

    return () => {
      mapRef.current?.off("moveend", onMoveEnd);
    };
  }, [mapLoaded, loading, pois.length, buscarEnMapbox]);

  /* ── Get user location ── */
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUbicacionUsuario(coords);
        // Fly to user location
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [coords[1], coords[0]], zoom: 14, duration: 2000 });
        }
      },
      () => setUbicacionUsuario([19.4326, -99.1332]), // fallback CDMX
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ── Route toggle ── */
  const togglePoiEnRuta = useCallback((poi: POI) => {
    setPoisEnRuta((prev) => {
      const exists = prev.find((p) => p.id === poi.id);
      if (exists) return prev.filter((p) => p.id !== poi.id);
      if (prev.length >= 12) return prev; // max 12 points
      return [...prev, poi];
    });
    setMostrarItinerario(false);
    mapboxOpt.clearRoute();
    mapboxOpt.setError("");
  }, []);

  const handleSelectPoi = useCallback((poi: POI) => {
    setSelectedPoi(poi);
    if (mapRef.current) mapRef.current.flyTo({ center: [poi.longitud, poi.latitud], zoom: 14, duration: 1000 });
  }, []);

  /* ── Calculate route via Mapbox Optimization API ── */
  const calcularRuta = async () => {
    if (poisEnRuta.length < 1) {
      mapboxOpt.setError(t("errorMinPuntos"));
      return;
    }
    const result = await mapboxOpt.calculateRoute(poisEnRuta, ubicacionUsuario, transportMode);
    if (result) {
      setPoisEnRuta(result.orderedPois);
      setMostrarItinerario(true);
      setMobileSheetOpen(false);
    }
  };

  const limpiarRuta = () => {
    setPoisEnRuta([]);
    mapboxOpt.clearRoute();
    setMostrarItinerario(false);
    setSavedRouteIdForParty(undefined);
    clearMapRoutes();
  };

  const clearMapRoutes = () => {
    if (!mapRef.current) return;
    ["main-glow", "main-base", "main-dash"].forEach((id) => {
      if (mapRef.current!.getLayer(id)) mapRef.current!.removeLayer(id);
    });
    if (mapRef.current.getSource("main-route")) mapRef.current.removeSource("main-route");
  };

  /* ── Save route ── */
  const guardarRuta = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGuardadoMsg(t("loginParaGuardar")); return; }
    if (poisEnRuta.length < 2 || !mapboxOpt.route) return;
    setGuardando(true);
    const nombre = poisEnRuta.map((p) => p.nombre).join(" → ");
    const { data, error } = await supabase.from("rutas_guardadas").insert({
      usuario_id: user.id,
      nombre,
      pois_ids: poisEnRuta.map((p) => p.id),
      pois_data: poisEnRuta.map((p) => ({ id: p.id, nombre: p.nombre, emoji: p.emoji, categoria: p.categoria })),
      distancia_texto: mapboxOpt.route.distancia_texto,
      duracion_texto: mapboxOpt.route.duracion_texto,
      es_publica: false,
    }).select("id").single();
    setGuardando(false);
    if (error) {
      setGuardadoMsg(t("errorGeneric"));
    } else {
      setGuardadoMsg(t("rutaGuardada"));
      if (data?.id) setSavedRouteIdForParty(data.id);
      setTimeout(() => setGuardadoMsg(""), 3000);
    }
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

  const cargarRutaEnMapa = (pois_data: { id: string; nombre: string; emoji: string; categoria: string }[]) => {
    // Try to find in both DB pois and mapbox pois
    const allAvailablePois = pois.length > 0 ? pois : mapboxPois;
    const poisParaRuta = pois_data
      .map((d) => allAvailablePois.find((p) => p.id === d.id))
      .filter(Boolean) as POI[];
    if (poisParaRuta.length < 1) { mapboxOpt.setError(t("errorGeneric")); return; }
    setPoisEnRuta(poisParaRuta);
    mapboxOpt.clearRoute();
    setMostrarItinerario(false);
    setMostrarGuardadas(false);
  };

  /* ── NEW: Sorpréndeme ── */
  const handleSorprendeme = async () => {
    const allAvailablePois = pois.length > 0 ? pois : mapboxPois;
    const seleccion = await sorprendeme.generarRutaAleatoria(allAvailablePois, ubicacionUsuario, {
      categoria: activeFilter,
      soloAbiertos,
      radioKm: 5,
      cantidad: 4,
    });
    if (seleccion) {
      setPoisEnRuta(seleccion);
      mapboxOpt.clearRoute();
      setMostrarItinerario(false);
      const result = await mapboxOpt.calculateRoute(seleccion, ubicacionUsuario, transportMode);
      if (result) {
        setPoisEnRuta(result.orderedPois);
        setMostrarItinerario(true);
        setMobileSheetOpen(false);
        if (mapRef.current) {
          const bounds = new mapboxgl.LngLatBounds();
          result.orderedPois.forEach((p) => bounds.extend([p.longitud, p.latitud]));
          mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });
        }
      }
    }
  };

  /* ── Share helpers ── */
  const copiarItinerario = () => {
    if (poisEnRuta.length === 0 || !mapboxOpt.route) return;
    const horas = calcularHorasLlegada(poisEnRuta, mapboxOpt.route.duracion_segundos);
    let texto = `🗺️ MUUL — ${t("itinerario")}\n📏 ${mapboxOpt.route.distancia_texto} · ⏱ ${mapboxOpt.route.duracion_texto}\n\n`;
    poisEnRuta.forEach((poi, i) => {
      texto += `${i + 1}. ${poi.emoji || "📍"} ${poi.nombre}\n   🕐 ~${horas[i]} · ⏱ ${DURACION_VISITA[poi.categoria] || 30} min\n`;
    });
    texto += `\n🏟️ Muul — ${t("marcaEvento")}`;
    navigator.clipboard.writeText(texto).then(() => {
      setGuardadoMsg(t("copiadoPortapapeles"));
      setTimeout(() => setGuardadoMsg(""), 3000);
    });
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
      setGuardadoMsg(t("imagenDescargada"));
      setTimeout(() => setGuardadoMsg(""), 3000);
    } catch {
      setGuardadoMsg(t("errorGeneric"));
      setTimeout(() => setGuardadoMsg(""), 3000);
    }
  };

  const compartirRuta = async () => {
    if (poisEnRuta.length === 0 || !mapboxOpt.route) return;
    const nombres = poisEnRuta.map((p) => `${p.emoji || "📍"} ${p.nombre}`).join(" → ");
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Muul",
          text: `🗺️ ${nombres}\n📏 ${mapboxOpt.route.distancia_texto} · ⏱ ${mapboxOpt.route.duracion_texto}`,
        });
      } catch {}
    } else {
      copiarItinerario();
    }
  };

  /* ── Render markers ── */
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
      const marker = new mapboxgl.Marker({ element: wrapper, anchor: "center" })
        .setLngLat([poi.longitud, poi.latitud])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // User dot
    if (ubicacionUsuario && mapRef.current) {
      const userEl = document.createElement("div");
      const userDot = document.createElement("div");
      userDot.style.cssText = `width:20px;height:20px;border-radius:50%;background:#003e6f;border:3px solid #ffffff;box-shadow:0 0 12px rgba(96,165,250,0.6);`;
      const userPulse = document.createElement("div");
      userPulse.style.cssText = `position:absolute;top:-6px;left:-6px;width:32px;height:32px;border-radius:50%;background:rgba(96,165,250,0.3);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;`;
      userEl.style.cssText = `position:relative;width:20px;height:20px;`;
      userEl.appendChild(userPulse);
      userEl.appendChild(userDot);
      const userMarker = new mapboxgl.Marker({ element: userEl, anchor: "center" })
        .setLngLat([ubicacionUsuario[1], ubicacionUsuario[0]])
        .addTo(mapRef.current);
      markersRef.current.push(userMarker);
    }
  }, [filteredPois, mapLoaded, poisEnRuta, handleSelectPoi, ubicacionUsuario]);

  /* ── Draw optimized route on map ── */
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    clearMapRoutes();

    const { route } = mapboxOpt;
    if (!route) return;

    const color = getRouteColorForMode(transportMode);
    const srcId = "main-route";

    mapRef.current.addSource(srcId, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: route.geometry },
    });
    mapRef.current.addLayer({
      id: "main-glow", type: "line", source: srcId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": color, "line-width": 14, "line-opacity": 0.2, "line-blur": 8 },
    });
    mapRef.current.addLayer({
      id: "main-base", type: "line", source: srcId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": color, "line-width": 5, "line-opacity": 0.9 },
    });
    mapRef.current.addLayer({
      id: "main-dash", type: "line", source: srcId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#ffffff", "line-width": 2, "line-opacity": 0.6, "line-dasharray": [0, 4, 3] },
    });

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds();
    (route.geometry.coordinates as [number, number][]).forEach((c) => bounds.extend(c));
    mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });

    // Animate dash
    const dashSteps = [
      [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
      [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 3, 3],
    ];
    let step = 0, lastTime = 0;
    const animate = (ts: number) => {
      if (!mapRef.current) return;
      if (ts - lastTime >= 80) {
        if (mapRef.current.getLayer("main-dash")) {
          mapRef.current.setPaintProperty("main-dash", "line-dasharray", dashSteps[step]);
        }
        step = (step + 1) % dashSteps.length;
        lastTime = ts;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [mapboxOpt.route, mapLoaded, transportMode]);

  const isInRoute = (poi: POI) => poisEnRuta.some((p) => p.id === poi.id);
  const formatHours = (poi: POI) => {
    if (!poi.horario_apertura || !poi.horario_cierre) return t("horarioNoDisponible");
    return `${t("abierto")} · ${t("cierra", { hora: poi.horario_cierre })}`;
  };

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col overflow-hidden pt-[80px] bg-surface text-on-surface font-body">
      <main className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar icon rail */}
<<<<<<< HEAD
        <aside className="hidden md:flex flex-col h-full w-20 bg-surface-container-low space-y-8 py-8 items-center border-r border-outline-variant/10">
          <Link href="/" className="w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest/50 transition-all">
            <span className="material-symbols-outlined">explore</span>
          </Link>
          <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-container-highest text-secondary shadow-lg shadow-secondary/10">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
          </button>
          <button onClick={cargarRutasGuardadas} className="w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest/50 transition-all">
            <span className="material-symbols-outlined">bookmark</span>
          </button>
          {/* Party mode icon */}
          <button
            onClick={() => setPartyModalOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest/50 transition-all"
            title="Modo Party"
          >
            <span className="material-symbols-outlined">celebration</span>
          </button>
=======
        <aside className="hidden md:flex flex-col h-full w-24 bg-white space-y-8 py-10 items-center border-r border-[#003e6f]/5 shadow-sm">
          <Link href="/" className="w-14 h-14 flex items-center justify-center rounded-2xl text-[#003e6f]/40 hover:bg-slate-50 hover:text-[#003e6f] transition-all"><span className="text-2xl">🔍</span></Link>
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#003e6f]/5 text-[#003e6f] shadow-lg shadow-[#003e6f]/5"><span className="text-2xl">🗺️</span></button>
          <button onClick={cargarRutasGuardadas} className="w-14 h-14 flex items-center justify-center rounded-2xl text-[#003e6f]/40 hover:bg-slate-50 hover:text-[#003e6f] transition-all"><span className="text-2xl">🔖</span></button>
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
        </aside>

        <div className="flex-1 flex overflow-hidden">

          {/* ── Desktop left panel ── */}
          <div className="hidden md:flex w-[360px] flex-col bg-surface-container-lowest relative z-30 border-r border-outline-variant/10">
            {!mostrarItinerario ? (
              <>
                {/* Search + filters */}
                <div className="p-6 space-y-4">
                  <div className="relative group">
<<<<<<< HEAD
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">search</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("buscar")}
                      className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40 transition-all"
                    />
=======
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">🔎</span>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("buscar")} className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40 transition-all" />
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                    {filters.map((f) => (
<<<<<<< HEAD
                      <button key={f.value} onClick={() => setActiveFilter(f.value)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${activeFilter === f.value ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface hover:bg-surface-bright"}`}>
                        {f.label} <span className="text-xs">{f.emoji}</span>
                      </button>
                    ))}
                    <button onClick={() => setSoloAbiertos(!soloAbiertos)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${soloAbiertos ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface hover:bg-surface-bright"}`}>
                      <span className="material-symbols-outlined text-sm">schedule</span>{t("abiertos")}
=======
                      <button key={f.value} onClick={() => setActiveFilter(f.value)} className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${activeFilter === f.value ? "bg-[#003e6f] text-white shadow-[#003e6f]/20" : "bg-white text-[#003e6f] hover:bg-slate-50 border border-slate-100"}`}>{f.label} <span className="text-sm">{f.emoji}</span></button>
                    ))}
                    <button onClick={() => setSoloAbiertos(!soloAbiertos)} className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${soloAbiertos ? "bg-[#fed000] text-[#003e6f] shadow-[#fed000]/20" : "bg-white text-[#003e6f] hover:bg-slate-50 border border-slate-100"}`}>
                      <span className="text-sm">⏰</span>{t("abiertos")}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                    </button>
                  </div>
                </div>

                {/* POI list */}
                <div className="flex-1 overflow-y-auto px-4 space-y-2" style={{ scrollbarWidth: "none" }}>
                  {loading || buscandoExternos ? (
                    <div className="space-y-3 p-4">
                      {[1,2,3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-4 p-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-high" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-surface-container-high rounded w-3/4" />
                            <div className="h-3 bg-surface-container-high rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredPois.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-12 px-4 space-y-3">
                      <span className="text-4xl">🔍</span>
                      <p className="text-on-surface-variant text-sm">{t("sinResultados")}</p>
                    </div>
                  ) : (
                    filteredPois.map((poi) => {
                      const inRoute = isInRoute(poi);
                      const routeNum = poisEnRuta.findIndex((p) => p.id === poi.id) + 1;
                      return (
<<<<<<< HEAD
                        <div key={poi.id} className={`p-4 rounded-xl flex items-start gap-4 transition-all ${selectedPoi?.id === poi.id ? "bg-surface-container-high border-l-4 border-secondary" : "hover:bg-surface-container-high"}`}>
                          <button onClick={() => handleSelectPoi(poi)} className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl shadow-inner shrink-0">
                            {poi.emoji || "📍"}
                          </button>
                          <button onClick={() => handleSelectPoi(poi)} className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-headline font-bold text-on-surface truncate">{poi.nombre}</h3>
                              {(poi as any).verificado && (
                                <span className="text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>Muul
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              <span className={isOpenNow(poi) ? "text-secondary" : "text-tertiary"}>● </span>
                              {formatHours(poi)}
                            </p>
                          </button>
                          <button onClick={() => togglePoiEnRuta(poi)}
                            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all ${inRoute ? "bg-secondary text-on-secondary shadow-glow-secondary" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"}`}>
                            {inRoute ? routeNum : <span className="material-symbols-outlined text-lg">add_location</span>}
=======
                        <div key={poi.id} className={`p-5 rounded-2xl flex items-start gap-4 transition-all duration-300 ${selectedPoi?.id === poi.id ? "bg-slate-50 border-l-4 border-[#003e6f] shadow-inner" : "hover:bg-slate-50/50"}`}>
                          <button onClick={() => handleSelectPoi(poi)} className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-3xl shadow-sm shrink-0 group-hover:scale-105 transition-transform">{poi.emoji || "📍"}</button>
                          <button onClick={() => handleSelectPoi(poi)} className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-headline font-black text-lg text-[#003e6f] truncate leading-tight">{poi.nombre}</h3>
                              {poi.verificado && (<span className="text-[#005596] text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5"><span className="text-xs">🌊</span>MUUL</span>)}
                            </div>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1"><span className={isOpenNow(poi) ? "text-emerald-500" : "text-rose-500"}>● </span>{formatHours(poi)}</p>
                          </button>
                          <button onClick={() => togglePoiEnRuta(poi)} className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${inRoute ? "bg-[#003e6f] text-white shadow-lg shadow-[#003e6f]/20" : "bg-slate-100 text-[#003e6f] hover:bg-slate-200"}`}>
                            {inRoute ? routeNum : <span className="text-xl">📍</span>}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Route builder controls */}
                <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 space-y-3">
<<<<<<< HEAD
                  {(mapboxOpt.error || sorprendeme.error) && (
                    <div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium animate-fade-in-up">
                      {mapboxOpt.error || sorprendeme.error}
                    </div>
                  )}

                  {/* AI ask button */}
                  <button
                    onClick={() => { if (selectedPoi) setChatbotAbierto(true); }}
                    disabled={!selectedPoi}
                    className="w-full mb-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary-container/20 text-primary border border-primary/20 font-headline font-bold text-sm transition-all hover:bg-primary-container/30 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
=======
                  {rutaError && (<div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium animate-fade-in-up">{rutaError}</div>)}
                  <button onClick={() => { if (selectedPoi) setChatbotAbierto(true); }} disabled={!selectedPoi}
                    className="w-full mb-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary-container/20 text-primary border border-primary/20 font-headline font-bold text-sm transition-all hover:bg-primary-container/30 disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="text-lg">✨</span>
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                    {selectedPoi ? t("preguntarAI", { nombre: selectedPoi.nombre }) : t("seleccionaPrimero")}
                  </button>

                  {/* Stops counter */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
<<<<<<< HEAD
                      <span className={`w-2 h-2 rounded-full ${poisEnRuta.length > 0 ? "bg-secondary animate-pulse" : "bg-on-surface-variant"}`} />
                      <span className="text-sm font-bold text-on-surface">
                        {poisEnRuta.length === 1 ? t("paradas", { count: 1 }) : t("paradasPlural", { count: poisEnRuta.length })}
                        <span className="text-on-surface-variant font-normal text-xs ml-1">(máx 12)</span>
                      </span>
                    </div>
                    {poisEnRuta.length > 0 && (
                      <button onClick={limpiarRuta} className="text-xs text-on-surface-variant hover:text-tertiary transition-colors font-bold">
                        {t("limpiar")}
                      </button>
                    )}
=======
                      <span className={`w-2.5 h-2.5 rounded-full ${poisEnRuta.length > 0 ? "bg-[#fed000] shadow-[0_0_10px_#fed000] animate-pulse" : "bg-slate-300"}`} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#003e6f]">{poisEnRuta.length === 1 ? t("paradas", { count: 1 }) : t("paradasPlural", { count: poisEnRuta.length })}</span>
                    </div>
                    {poisEnRuta.length > 0 && (<button onClick={limpiarRuta} className="text-[10px] text-rose-500 hover:text-rose-600 transition-colors font-black uppercase tracking-widest">{t("limpiar")}</button>)}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                  </div>

                  {/* Transport mode selector */}
                  <TransportSelector value={transportMode} onChange={setTransportMode} />

                  {/* Sorpréndeme + Calculate */}
                  <div className="flex gap-2">
<<<<<<< HEAD
                    <button
                      onClick={handleSorprendeme}
                      disabled={sorprendeme.loading || mapboxOpt.loading}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-3 rounded-xl bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high text-xs font-bold transition-all disabled:opacity-40"
                      title="Generar ruta aleatoria en 5km"
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>casino</span>
                      <span className="hidden lg:inline">Sorpréndeme</span>
                    </button>
                    <button
                      onClick={calcularRuta}
                      disabled={poisEnRuta.length < 1 || mapboxOpt.loading}
                      className="flex-1 bg-secondary hover:bg-secondary-fixed text-on-secondary py-4 rounded-xl font-headline font-black uppercase tracking-widest transition-all shadow-lg shadow-secondary/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {mapboxOpt.loading ? t("calculando") : t("calcularRuta")}
                    </button>
                  </div>
=======
                    <button onClick={() => setModoAccesible(!modoAccesible)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${modoAccesible ? "bg-[#003e6f] text-white shadow-lg shadow-[#003e6f]/20" : "bg-slate-100 text-[#003e6f] hover:bg-slate-200"}`}>
                      <span className="text-base">♿</span>{t("accesible")}
                    </button>
                    <button onClick={() => setModoVehiculo(!modoVehiculo)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${modoVehiculo ? "bg-[#fed000] text-[#003e6f] shadow-lg shadow-[#fed000]/20" : "bg-slate-100 text-[#003e6f] hover:bg-slate-200"}`}>
                      <span className="text-base">🚗</span>{t("vehiculo")}
                    </button>
                  </div>
                  <button onClick={calcularRuta} disabled={poisEnRuta.length < 2 || calculando} className="w-full bg-[#003e6f] text-white !text-white hover:bg-[#005596] py-5 rounded-3xl font-headline font-black uppercase tracking-tighter text-xl transition-all shadow-xl shadow-[#003e6f]/10 disabled:opacity-40 disabled:scale-[0.98] disabled:cursor-not-allowed">
                    {calculando ? t("calculando") : t("calcularRuta")}
                  </button>
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                </div>
              </>
            ) : (
              /* ── Itinerary view ── */
              <>
                <div ref={itinerarioRef} className="flex flex-col flex-1 overflow-hidden bg-surface-container-lowest">
                  <div className="p-6 border-b border-outline-variant/10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-headline font-black text-on-surface text-sm uppercase tracking-widest">{t("itinerario")}</h2>
                      <button onClick={() => setMostrarItinerario(false)} className="text-xs text-on-surface-variant hover:text-on-surface font-bold flex items-center gap-1 transition-colors">
                        <span className="text-sm">←</span> {t("volver")}
                      </button>
                    </div>
                    {mapboxOpt.route && (
                      <div className="p-3 rounded-xl bg-surface-container-high flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getRouteColorForMode(transportMode) }} />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-on-surface capitalize">{transportMode === "walking" ? "Caminando" : transportMode === "cycling" ? "Bicicleta" : "Vehículo"}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {mapboxOpt.route.distancia_texto} · {mapboxOpt.route.duracion_texto} + {Math.round(poisEnRuta.reduce((a, p) => a + (DURACION_VISITA[p.categoria] || 30), 0))} min visitas
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded uppercase">Óptima</span>
                      </div>
                    )}
                  </div>

                  {/* Stops list */}
                  <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
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
                        </div>
                      )}
                      {poisEnRuta.map((poi, i) => (
                        <div key={poi.id} className="flex items-center gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black bg-surface-container-highest"
                            style={{ borderColor: getRouteColorForMode(transportMode) }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-on-surface font-medium truncate block">{poi.nombre}</span>
                            <span className="text-[10px] text-on-surface-variant">
                              {t("llegada", { hora: calcularHorasLlegada(poisEnRuta, mapboxOpt.route?.duracion_segundos ?? 0)[i] })} · {t("minVisita", { min: DURACION_VISITA[poi.categoria] || 30 })}
                            </span>
                          </div>
                          <span className="text-lg">{poi.emoji}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Itinerary action buttons */}
                <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 space-y-3">
                  {guardadoMsg && (
                    <p className={`text-xs font-bold text-center animate-fade-in-up ${guardadoMsg.includes("Error") ? "text-error" : "text-secondary"}`}>
                      {guardadoMsg}
                    </p>
                  )}

                  {/* Share dropdown */}
                  <div className="relative">
<<<<<<< HEAD
                    <button onClick={() => setCompartirMenuOpen((v) => !v)}
                      className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-surface-bright transition-all uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">share</span>{t("compartir")}
=======
                    <button
                      onClick={() => setCompartirMenuOpen((v) => !v)}
                      className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-surface-bright transition-all uppercase tracking-wider"
                    >
                      <span className="text-sm">🔗</span>
                      {t("compartir")}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
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
<<<<<<< HEAD

                  {/* Party mode button */}
                  <button
                    onClick={() => setPartyModalOpen(true)}
                    className="w-full bg-gradient-to-r from-secondary/20 to-primary/10 text-on-surface py-3 rounded-xl font-headline font-bold text-sm border border-secondary/20 flex items-center justify-center gap-2 hover:from-secondary/30 transition-all"
                  >
                    <span className="text-base">🎉</span> Modo Party
                  </button>

                  <button onClick={guardarRuta} disabled={guardando}
                    className="w-full bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    {guardando ? t("guardando") : t("guardarRuta")}
                  </button>
                  <button onClick={limpiarRuta} className="w-full border border-tertiary/30 text-tertiary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:bg-tertiary/10 transition-all">
                    {t("nuevaRuta")}
=======
                  <button onClick={guardarRuta} disabled={guardando} className="w-full bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="text-sm">🔖</span>{guardando ? t("guardando") : t("guardarRuta")}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Map area ── */}
          <div className="flex-1 relative overflow-hidden">
            <div ref={mapContainer} className="absolute inset-0" />

            {/* Sorpréndeme FAB — floating on map */}
            <div className="absolute top-4 left-4 z-20">
              <SorprendemeFAB
                onClick={handleSorprendeme}
                loading={sorprendeme.loading || mapboxOpt.loading}
                disabled={!ubicacionUsuario}
              />
            </div>

            {/* POI card — enhanced with photo */}
            {selectedPoi && !mostrarItinerario && (
<<<<<<< HEAD
              <POICard
                poi={selectedPoi}
                isInRoute={isInRoute(selectedPoi)}
                routeIndex={poisEnRuta.findIndex((p) => p.id === selectedPoi.id)}
                onClose={() => setSelectedPoi(null)}
                onToggleRoute={togglePoiEnRuta}
                onAskAI={(poi) => { setChatbotAbierto(true); setMobileSheetOpen(false); }}
                t={t}
              />
=======
              <div className="absolute bottom-[180px] md:bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[380px] bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl p-6 md:p-8 border border-white/20 z-50 animate-fade-in-up">
                <div className="flex gap-4 mb-5 md:mb-6">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-3xl md:text-5xl shadow-inner shrink-0">{selectedPoi.emoji || "📍"}</div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-headline font-black text-[#003e6f] text-lg md:text-2xl leading-tight truncate">{selectedPoi.nombre}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1"><span className={isOpenNow(selectedPoi) ? "text-emerald-500" : "text-rose-500"}>● </span>{formatHours(selectedPoi)}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] bg-slate-100 text-[#003e6f] px-2 py-1 rounded-lg font-black uppercase tracking-wider">{selectedPoi.categoria}</span>
                      {selectedPoi.precio_rango && <span className="text-[9px] bg-slate-100 text-[#003e6f] px-2 py-1 rounded-lg font-black uppercase tracking-wider">{selectedPoi.precio_rango}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedPoi(null)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-[#003e6f] hover:bg-slate-200 transition-colors">
                    <span className="text-base font-black">✕</span>
                  </button>
                </div>
                {selectedPoi.descripcion && <p className="text-xs text-neutral-500 leading-relaxed mb-6 line-clamp-2 hidden md:block font-medium">{selectedPoi.descripcion}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => togglePoiEnRuta(selectedPoi)}
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isInRoute(selectedPoi) ? "bg-rose-50 text-rose-500 border border-rose-100" : "bg-[#003e6f] text-white !text-white shadow-lg shadow-[#003e6f]/20"}`}
                  >
                    {isInRoute(selectedPoi) ? t("quitarRuta") : t("agregarRuta")}
                  </button>
                  <button
                    onClick={() => { setChatbotAbierto(true); setMobileSheetOpen(false); }}
                    className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#fed000] text-[#003e6f] flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#fed000]/20"
                  >
                    <span className="text-base">✨</span>
                    <span>{t("muulAi")}</span>
                  </button>
                </div>
              </div>
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
            )}
          </div>
        </div>

        {/* ── Saved routes modal ── */}
        {mostrarGuardadas && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm" onClick={() => setMostrarGuardadas(false)} />
            <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-outline-variant/10 animate-fade-in-up">
              <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
                <h2 className="font-headline font-black text-on-surface text-sm uppercase tracking-widest">{t("misRutas")}</h2>
<<<<<<< HEAD
                <button onClick={() => setMostrarGuardadas(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
=======
                <button onClick={() => setMostrarGuardadas(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors"><span className="text-on-surface-variant">✕</span></button>
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
                {rutasGuardadas.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-12 space-y-3">
                    <span className="text-4xl">🗺️</span>
                    <p className="text-on-surface-variant text-sm">{t("sinRutas")}</p>
                  </div>
                ) : (
                  rutasGuardadas.map((ruta) => (
                    <div key={ruta.id} className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-1 mb-1 items-center">
                            {ruta.pois_data?.map((p: any, i: number) => (
                              <span key={i} className="text-lg">{p.emoji}</span>
                            ))}
                            {ruta.es_publica && (
                              <span className="ml-1 text-[9px] font-black text-secondary bg-secondary/10 px-1.5 py-0.5 rounded uppercase">Party</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface font-bold truncate">{ruta.nombre}</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">{ruta.distancia_texto} · {ruta.duracion_texto}</p>
                        </div>
<<<<<<< HEAD
                        <button onClick={() => eliminarRutaGuardada(ruta.id)} className="text-on-surface-variant hover:text-tertiary transition-colors shrink-0">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => cargarRutaEnMapa(ruta.pois_data)} className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-lg text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all">
                          {t("cargarMapa")}
                        </button>
                        {!ruta.es_publica && (
                          <button
                            onClick={() => { setSavedRouteIdForParty(ruta.id); setPartyModalOpen(true); setMostrarGuardadas(false); }}
                            className="px-3 py-2.5 rounded-lg text-xs font-black bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-all"
                            title="Activar Party Mode"
                          >
                            🎉
                          </button>
                        )}
=======
                        <button onClick={() => eliminarRutaGuardada(ruta.id)} className="text-on-surface-variant hover:text-tertiary transition-colors shrink-0"><span className="text-sm">🗑️</span></button>
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Party Mode Modal ── */}
        <PartyModeModal
          isOpen={partyModalOpen}
          onClose={() => { setPartyModalOpen(false); setSavedRouteIdForParty(undefined); }}
          savedRouteId={savedRouteIdForParty}
          poisEnRuta={poisEnRuta}
          distanciaTexto={mapboxOpt.route?.distancia_texto}
          duracionTexto={mapboxOpt.route?.duracion_texto}
          onLoadRoute={(pois_data) => cargarRutaEnMapa(pois_data)}
        />

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

        {/* Search + filters always visible */}
        <div className="px-4 pb-3 space-y-2 shrink-0">
          <div className="relative">
<<<<<<< HEAD
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input type="text" value={searchQuery}
=======
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">🔎</span>
            <input
              type="text"
              value={searchQuery}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
              onChange={(e) => { setSearchQuery(e.target.value); if (!mobileSheetOpen) setMobileSheetOpen(true); }}
              placeholder={t("buscar")}
              className="w-full bg-surface-container-highest border-none rounded-xl py-3 pl-10 pr-4 text-on-surface text-sm placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {filters.map((f) => (
              <button key={f.value} onClick={() => { setActiveFilter(f.value); if (!mobileSheetOpen) setMobileSheetOpen(true); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${activeFilter === f.value ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface"}`}>
                {f.label} <span>{f.emoji}</span>
              </button>
            ))}
<<<<<<< HEAD
            <button onClick={() => { setSoloAbiertos(!soloAbiertos); if (!mobileSheetOpen) setMobileSheetOpen(true); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${soloAbiertos ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface"}`}>
              <span className="material-symbols-outlined text-sm">schedule</span>{t("abiertos")}
=======
            <button
              onClick={() => { setSoloAbiertos(!soloAbiertos); if (!mobileSheetOpen) setMobileSheetOpen(true); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                soloAbiertos ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface"
              }`}
            >
              <span className="text-sm">⏰</span>
              {t("abiertos")}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
            </button>
          </div>
        </div>

        {mobileSheetOpen && (
          <>
            {mostrarItinerario ? (
              /* ── Mobile itinerary ── */
              <>
                <div className="flex-1 overflow-y-auto px-4 space-y-3" style={{ scrollbarWidth: "none" }}>
                  {mapboxOpt.route && (
                    <div className="p-3 rounded-xl bg-surface-container-high flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getRouteColorForMode(transportMode) }} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-on-surface capitalize">{transportMode}</p>
                        <p className="text-[10px] text-on-surface-variant">{mapboxOpt.route.distancia_texto} · {mapboxOpt.route.duracion_texto}</p>
                      </div>
                    </div>
                  )}
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
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black bg-surface-container-highest shrink-0"
                          style={{ borderColor: getRouteColorForMode(transportMode) }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-on-surface font-medium truncate block">{poi.nombre}</span>
                          <span className="text-[10px] text-on-surface-variant">
                            {t("llegada", { hora: calcularHorasLlegada(poisEnRuta, mapboxOpt.route?.duracion_segundos ?? 0)[i] })} · {t("minVisita", { min: DURACION_VISITA[poi.categoria] || 30 })}
                          </span>
                        </div>
                        <span className="text-lg shrink-0">{poi.emoji}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-3 border-t border-outline-variant/10 space-y-2 shrink-0">
                  {guardadoMsg && (
                    <p className={`text-xs font-bold text-center ${guardadoMsg.includes("Error") ? "text-error" : "text-secondary"}`}>{guardadoMsg}</p>
                  )}
                  <div className="relative">
<<<<<<< HEAD
                    <button onClick={() => setCompartirMenuOpen((v) => !v)}
                      className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-bright transition-all uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">share</span>{t("compartir")}
=======
                    <button
                      onClick={() => setCompartirMenuOpen((v) => !v)}
                      className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-bright transition-all uppercase tracking-wider"
                    >
                      <span className="text-sm">🔗</span>
                      {t("compartir")}
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
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
<<<<<<< HEAD
                  <button onClick={() => setPartyModalOpen(true)}
                    className="w-full bg-gradient-to-r from-secondary/20 to-primary/10 text-on-surface py-3 rounded-xl font-headline font-bold text-sm border border-secondary/20 flex items-center justify-center gap-2">
                    <span>🎉</span> Modo Party
                  </button>
                  <button onClick={guardarRuta} disabled={guardando}
                    className="w-full bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
=======
                  <button onClick={guardarRuta} disabled={guardando} className="w-full bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="text-sm">🔖</span>
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                    {guardando ? t("guardando") : t("guardarRuta")}
                  </button>
                  <button onClick={limpiarRuta}
                    className="w-full border border-tertiary/30 text-tertiary py-2.5 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:bg-tertiary/10 transition-all">
                    {t("nuevaRuta")}
                  </button>
                </div>
              </>
            ) : (
              /* ── Mobile POI list + route builder ── */
              <>
                <div className="flex-1 overflow-y-auto px-4 space-y-2" style={{ scrollbarWidth: "none" }}>
                  {loading || buscandoExternos ? (
                    <div className="space-y-3 p-2">
                      {[1,2,3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-3 p-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-high shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-surface-container-high rounded w-3/4" />
                            <div className="h-2 bg-surface-container-high rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
<<<<<<< HEAD
                  ) : filteredPois.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-8 space-y-2">
                      <span className="text-3xl">🔍</span>
                      <p className="text-on-surface-variant text-xs">{t("sinResultados")}</p>
=======
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
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
                    </div>
                  ) : (
                    filteredPois.map((poi) => {
                      const inRoute = isInRoute(poi);
                      const routeNum = poisEnRuta.findIndex((p) => p.id === poi.id) + 1;
                      return (
                        <div key={poi.id} className={`p-3 rounded-xl flex items-center gap-3 transition-all ${selectedPoi?.id === poi.id ? "bg-surface-container-high border-l-4 border-secondary" : "hover:bg-surface-container-high"}`}>
                          <button onClick={() => { handleSelectPoi(poi); setMobileSheetOpen(false); }}
                            className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-xl shrink-0">
                            {poi.emoji || "📍"}
                          </button>
                          <button onClick={() => { handleSelectPoi(poi); setMobileSheetOpen(false); }} className="flex-1 min-w-0 text-left">
                            <h3 className="font-headline font-bold text-on-surface text-sm truncate">{poi.nombre}</h3>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              <span className={isOpenNow(poi) ? "text-secondary" : "text-tertiary"}>● </span>
                              {formatHours(poi)}
                            </p>
                          </button>
                          <button onClick={() => togglePoiEnRuta(poi)}
                            className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all ${inRoute ? "bg-secondary text-on-secondary" : "bg-surface-container-highest text-on-surface-variant"}`}>
                            {inRoute ? routeNum : <span className="material-symbols-outlined text-base">add_location</span>}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

<<<<<<< HEAD
                <div className="px-4 pb-4 pt-3 border-t border-outline-variant/10 space-y-2 shrink-0">
                  {(mapboxOpt.error || sorprendeme.error) && (
                    <div className="p-2 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium">
                      {mapboxOpt.error || sorprendeme.error}
                    </div>
                  )}
                  <button onClick={() => { if (selectedPoi) { setChatbotAbierto(true); setMobileSheetOpen(false); } }} disabled={!selectedPoi}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary-container/20 text-primary border border-primary/20 font-headline font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    {selectedPoi ? t("preguntarAI", { nombre: selectedPoi.nombre }) : t("seleccionaPrimero")}
                  </button>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${poisEnRuta.length > 0 ? "bg-secondary animate-pulse" : "bg-on-surface-variant"}`} />
                      <span className="text-xs font-bold text-on-surface">
                        {poisEnRuta.length === 1 ? t("paradas", { count: 1 }) : t("paradasPlural", { count: poisEnRuta.length })}
                        <span className="text-on-surface-variant font-normal ml-1">/12</span>
                      </span>
                    </div>
                    {poisEnRuta.length > 0 && (
                      <button onClick={limpiarRuta} className="text-xs text-on-surface-variant hover:text-tertiary font-bold">{t("limpiar")}</button>
                    )}
                  </div>

                  {/* Transport selector mobile */}
                  <TransportSelector value={transportMode} onChange={setTransportMode} />

                  <div className="flex gap-2">
                    <button onClick={handleSorprendeme} disabled={sorprendeme.loading || mapboxOpt.loading}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-40"
                      title="Sorpréndeme">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>casino</span>
                    </button>
                    <button onClick={calcularRuta} disabled={poisEnRuta.length < 1 || mapboxOpt.loading}
                      className="flex-1 bg-secondary text-on-secondary py-3 rounded-xl font-headline font-black text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                      {mapboxOpt.loading ? t("calculando") : t("calcularRuta")}
                    </button>
                  </div>
                </div>
              </>
=======
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
>>>>>>> 08e106928bfbe3b5cc7787470ad2d9ce321ae956
            )}
          </>
        )}
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant/10 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-3 gap-2">
          <Link href="/" className="flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center text-on-surface-variant transition-colors hover:bg-white/70 hover:text-on-surface">
            <span className="text-lg leading-none">🔍</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] leading-tight">{tn("explorar")}</span>
          </Link>
          <Link href="/tiendas" className="flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center text-on-surface-variant transition-colors hover:bg-white/70 hover:text-on-surface">
            <span className="text-lg leading-none">🏪</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] leading-tight">{tn("categorias")}</span>
          </Link>
<<<<<<< HEAD
          <button onClick={() => setMobileSheetOpen((v) => !v)} className="flex flex-col items-center gap-1 text-secondary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
=======
          <button
            onClick={() => setMobileSheetOpen((v) => !v)}
            className="flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center text-secondary transition-colors hover:bg-[#003e6f]/5"
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