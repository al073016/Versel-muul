"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { SocialService } from "@/lib/services/social.service";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";

import type { POI, RutaGuardada, Producto } from "@/types/database";
import html2canvas from "html2canvas";
import ChatModal from "@/components/ui/ChatModal";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { applyMuulMapStyle } from "@/lib/mapStyle";

// ── Feature hooks & components ──
import { useMapboxOptimization, type TransportMode } from "@/hooks/useMapboxOptimization";
import { useAccessibleRoute } from "@/hooks/useAccessibleRoute";
import { usePartyMode } from "@/hooks/usePartyMode";
import { useSorprendeme } from "@/hooks/useSorprendeme";
import TransportSelector, { getRouteColorForMode, type RouteMode } from "@/components/map/TransportSelector";
import { useMetroRoute, getMetroCityByLocation } from "@/hooks/useMetroRoute";
import POICard from "@/components/map/POICard";
import PartyModeModal from "@/components/map/PartyModeModal";
import AccessibilityFeaturesLayer from "@/components/map/AccessibilityFeaturesLayer";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { haversine } from "@/lib/haversine";
import { useNearbySearch } from "@/hooks/useNearbySearch";
import { getLocalizedDummyPois } from "@/lib/dummy-data";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

/* ── Types ── */
interface UserInfo { initials: string; nombre: string }

/* ── Visit duration by category (minutes) ── */
const DURACION_VISITA: Record<string, number> = {
  cultural: 60,
  comida: 45,
  tienda: 30,
  deportes: 90,
  servicio: 20,
  servicios: 30,
  hospedaje: 40,
  eventos: 120,
};

/* ── Helpers ── */
function getMarkerColor(cat: string): string {
  const m: Record<string, string> = {
    comida: "#ffb3b3",
    cultural: "#b0c6fd",
    deportes: "#98d5a2",
    tienda: "#8a8a8e",
    servicio: "#8a8a8e",
    servicios: "#8a8a8e",
    hospedaje: "#b9a5ff",
    eventos: "#ff9ec4",
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

// Utility to check if a string is a valid UUID
function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

function isMissingColumnError(error: unknown, column: string): boolean {
  const msg = String((error as { message?: string })?.message || "").toLowerCase();
  return msg.includes("column") && msg.includes(column.toLowerCase());
}

function getSupabaseErrorMessage(error: unknown): string {
  return String((error as { message?: string })?.message || "");
}

function getMissingColumnName(error: unknown): string | null {
  const msg = getSupabaseErrorMessage(error);
  const match = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does\s+not\s+exist/i);
  return match?.[1] ?? null;
}

async function ensurePerfilRow(
  supabase: any,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<boolean> {
  const { data: existing, error: readErr } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!readErr && existing?.id) return true;

  const nombrePerfil =
    String(user.user_metadata?.nombre || user.user_metadata?.full_name || "").trim() ||
    String(user.email || "").split("@")[0] ||
    "Usuario";

  let payload: Record<string, unknown> = {
    id: user.id,
    tipo_cuenta: "turista",
    nombre: nombrePerfil,
    correo: user.email ?? null,
    idioma: "es-MX",
  };

  for (let i = 0; i < 5; i += 1) {
    const result = await supabase.from("perfiles").upsert(payload, { onConflict: "id" });
    if (!result.error) return true;

    const missingCol = getMissingColumnName(result.error);
    if (missingCol && missingCol in payload) {
      delete payload[missingCol];
      continue;
    }

    console.warn("ensurePerfilRow upsert warning:", result.error);
    return false;
  }

  return false;
}

async function insertRutaCompatible(
  supabase: any,
  payload: Record<string, unknown>
): Promise<{ data: { id: string } | null; error: unknown | null }> {
  let currentPayload: Record<string, unknown> = { ...payload };

  for (let i = 0; i < 6; i += 1) {
    const result = await supabase
      .from("rutas_guardadas")
      .insert(currentPayload)
      .select("id")
      .single();

    if (!result.error) {
      return { data: result.data as { id: string }, error: null };
    }

    const missingCol = getMissingColumnName(result.error);
    if (missingCol && missingCol in currentPayload) {
      delete currentPayload[missingCol];
      continue;
    }

    const msg = getSupabaseErrorMessage(result.error).toLowerCase();
    if (msg.includes("invalid input syntax for type uuid") && "pois_ids" in currentPayload) {
      const rawPoisIds = Array.isArray(currentPayload.pois_ids) ? (currentPayload.pois_ids as string[]) : [];
      currentPayload = { ...currentPayload, pois_ids: rawPoisIds.filter(isUuid) };
      continue;
    }

    return { data: null, error: result.error };
  }

  return { data: null, error: new Error("No se pudo guardar la ruta tras varios intentos de compatibilidad") };
}

// Robust insert helper for the hackathon
async function safeInsertRuta(supabase: any, payload: any) {
  let currentPayload = { ...payload };
  const maxAttempts = 3;
  
  const getSupabaseErrorMessage = (err: any) => {
    if (typeof err === "string") return err;
    return err?.message || JSON.stringify(err);
  };

  const getMissingColumnName = (err: any) => {
    const msg = getSupabaseErrorMessage(err);
    const match = msg.match(/column "(.*?)" is not/);
    return match ? match[1] : null;
  };

  for (let i = 0; i < maxAttempts; i++) {
    const result = await supabase.from("rutas_guardadas").insert(currentPayload).select("id");
    
    if (!result.error) {
      return { data: result.data as { id: string }, error: null };
    }

    const missingCol = getMissingColumnName(result.error);
    if (missingCol && missingCol in currentPayload) {
      delete currentPayload[missingCol];
      continue;
    }

    const msg = getSupabaseErrorMessage(result.error).toLowerCase();
    
    // RLS Permission Denied Fix for Hackathon
    if (msg.includes("permission denied") || msg.includes("row-level security")) {
      try {
        const localRoutes = JSON.parse(localStorage.getItem("muul_local_routes") || "[]");
        const newLocalRoute = { 
          ...currentPayload, 
          id: `local_${Date.now()}`, 
          created_at: new Date().toISOString(),
          is_local: true 
        };
        localStorage.setItem("muul_local_routes", JSON.stringify([newLocalRoute, ...localRoutes]));
        return { data: { id: newLocalRoute.id }, error: null, isLocal: true } as any;
      } catch (e) {
        console.error("Local storage fail:", e);
      }
    }

    if (msg.includes("invalid input syntax for type uuid") && "pois_ids" in currentPayload) {
      // Clean non-uuid IDs
      const rawPoisIds = Array.isArray(currentPayload.pois_ids) ? (currentPayload.pois_ids as string[]) : [];
      currentPayload = { ...currentPayload, pois_ids: rawPoisIds.filter(isUuid) };
      continue;
    }

    return { data: null, error: result.error };
  }

  return { data: null, error: new Error("No se pudo guardar la ruta tras varios intentos de compatibilidad") };
}

function calcularHorasLlegada(poisRuta: POI[], duracionSegundos: number): string[] {
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
    return llegada.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
  });
}

/* ── Helper: Sort POIs by proximity to origin ── */
const ordenarPorCercaniaAlOrigen = (
  pois: POI[],
  origen: [number, number] | null
): POI[] => {
  if (!Array.isArray(pois) || pois.length === 0) return [];
  if (!origen || pois.length <= 1) return [...pois];

  return [...pois].sort(
    (a, b) =>
      haversine(origen, [a.latitud, a.longitud]) -
      haversine(origen, [b.latitud, b.longitud])
  );
};

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
  const userWatchIdRef = useRef<number | null>(null);
  const centeredOnceRef = useRef(false);
  const t = useTranslations("mapa");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const dummyPois = useMemo(() => getLocalizedDummyPois(locale), [locale]);

  const filters = [
    { label: t("todos"), emoji: "🗺️", value: "todos" },
    { label: t("comida"), emoji: "🍜", value: "comida" },
    { label: t("cultural"), emoji: "🏛️", value: "cultural" },
    { label: t("deportes"), emoji: "⚽", value: "deportes" },
    { label: t("tiendas"), emoji: "🛍️", value: "tienda" },
    { label: t("hospedaje"), emoji: "🏨", value: "hospedaje" },
    { label: t("eventos"), emoji: "🎟️", value: "eventos" },
    { label: t("servicios"), emoji: "🛠️", value: "servicios" },
  ];

  // ── Feature hooks ──
  const mapboxOpt = useMapboxOptimization();
  const accessibleRoute = useAccessibleRoute();
  const metroRoute = useMetroRoute();
  const partyMode = usePartyMode();
  const sorprendeme = useSorprendeme();
  const { buscarLugarGlobal, buscandoGlobal } = useGlobalSearch();
  const { buscarCercanos, buscandoExternos } = useNearbySearch();

  // ── State ──
  const [allPois, setAllPois] = useState<POI[]>(dummyPois as any);

  useEffect(() => {
    const fetchSupabaseNegocios = async () => {
      try {
        const { data, error } = await supabase
          .from("negocios")
          .select("*")
          .eq("activo", true);
        
        if (!error && data) {
          const supabasePois: POI[] = data.map(n => {
            const isTino = n.nombre.toLowerCase().includes("tino") || n.nombre.toLowerCase().includes("justino");
            const lat = isTino ? 19.3615 : n.latitud;
            const lng = isTino ? -99.2740 : n.longitud;
            
            return {
              id: n.id,
              nombre: n.nombre,
              descripcion: n.descripcion ?? null,
              categoria: n.categoria as POI["categoria"],
              latitud: lat,
              longitud: lng,
              direccion: isTino ? "Santa Fe (Puesto Muul)" : (n.direccion || ""),
              emoji: n.categoria === "comida" ? "🌮" : n.categoria === "tienda" ? "🛍️" : "📍",
              foto_url: n.foto_url || null,
              verificado: n.verificado,
              precio_rango: n.precio_rango ?? null,
              negocio_id: n.negocio_id ?? n.id,
              horario_apertura: n.horario_apertura || "09:00",
              horario_cierre: n.horario_cierre || "21:00",
              created_at: n.created_at || new Date().toISOString(),
            } satisfies POI;
          });

          setAllPois(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = supabasePois.filter(p => !existingIds.has(p.id));
            return [...prev, ...newOnes];
          });
        }
      } catch (err) {
        console.error("Error fetching negocios from Supabase:", err);
      }
    };

    fetchSupabaseNegocios();
  }, [supabase]);

  const [filteredPois, setFilteredPois] = useState<POI[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
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
  const [transportMode, setTransportMode] = useState<RouteMode>("walking");
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [savedRouteIdForParty, setSavedRouteIdForParty] = useState<string | undefined>();
  const [showAccessibilityFeatures, setShowAccessibilityFeatures] = useState(true);

  /* ── Derived ── */
  const isAccessibleMode = transportMode === "accessible";
  const isMetroMode = transportMode === "metro";
  const metroCity = useMemo(() => getMetroCityByLocation(ubicacionUsuario), [ubicacionUsuario]);
  const metroEnabled = Boolean(metroCity);

  const activeRoute = isAccessibleMode
    ? accessibleRoute.route
    : isMetroMode
      ? metroRoute.route
      : mapboxOpt.route;

  const activeLoading = isAccessibleMode
    ? accessibleRoute.loading
    : isMetroMode
      ? metroRoute.loading
      : mapboxOpt.loading;

  const metroErrorText = useMemo(() => {
    if (!metroRoute.error) return "";
    if (metroRoute.error === "metro_unavailable_city") return t("metroUnavailableCity");
    if (metroRoute.error === "metro_no_nearby_station") return t("metroNoStationsNearby");
    if (metroRoute.error === "metro_no_path") return t("metroNoCoverage");
    if (metroRoute.error === "metro_no_location") return t("requireUserLocation");
    return t("errorGeneric");
  }, [metroRoute.error, t]);

  const activeError = isAccessibleMode
    ? (accessibleRoute.error || sorprendeme.error)
    : isMetroMode
      ? (metroErrorText || sorprendeme.error)
      : (mapboxOpt.error || sorprendeme.error);

  useEffect(() => {
    if (isMetroMode && !metroEnabled) {
      setTransportMode("walking");
    }
  }, [isMetroMode, metroEnabled]);

  const lugaresCercanosMuul = useMemo(() => {
    if (!ubicacionUsuario) return [];

    return [...allPois]
      .filter((poi) => poi.verificado !== false && !String(poi.id).startsWith("mapbox_"))
      .map((poi) => ({
        poi,
        distancia: haversine(ubicacionUsuario, [poi.latitud, poi.longitud]),
      }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 8)
      .map(({ poi }) => poi);
  }, [allPois, ubicacionUsuario]);

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

  /* ── Load POIs ── */
  useEffect(() => {
    const fetchPois = async () => {
      try {
        const { data } = await supabase.from("pois").select("*").order("created_at", { ascending: false });
        const dbPois = data || [];
        
        setAllPois(prev => {
          const merged = [...prev];
          dbPois.forEach(d => {
            if (!merged.find(p => p.id === d.id)) merged.push(d as any);
          });
          return merged;
        });
      } catch (err) {
        console.error("Error fetching supplemental POIs:", err);
      }
    };
    fetchPois();
  }, [supabase]);

  /* ── Party URL param ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("party")) setPartyModalOpen(true);
  }, []);

  /* ──────────────────────────────────────────────
     CORE: Fetch nearby POIs (Supabase + Mapbox)
     Triggered on map load, map move, and user location
     ────────────────────────────────────────────── */
  const fetchNearbyPois = useCallback(async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();

    const { merged } = await buscarCercanos([center.lat, center.lng], zoom);
    if (merged.length > 0) {
      setAllPois(prev => {
        const result = [...prev];
        merged.forEach(m => {
          if (!result.find(r => r.id === m.id)) result.push(m);
        });
        return result;
      });
    }
  }, [buscarCercanos]);

  // Initial fetch + map move listener
  useEffect(() => {
    if (!mapLoaded) return;

    // Initial fetch
    fetchNearbyPois().then(() => setInitialLoadDone(true));

    // Re-fetch when user moves the map
    const onMoveEnd = () => fetchNearbyPois();
    mapRef.current?.on("moveend", onMoveEnd);

    return () => {
      mapRef.current?.off("moveend", onMoveEnd);
    };
  }, [mapLoaded, fetchNearbyPois]);

  /* ── Filter POIs & Sort by Distance ── */
  useEffect(() => {
    let result = [...allPois];

    if (activeFilter !== "todos") result = result.filter((p) => p.categoria === activeFilter);
    if (soloAbiertos) result = result.filter((p) => isOpenNow(p));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => 
          p.nombre.toLowerCase().includes(q) || 
          p.descripcion?.toLowerCase().includes(q) || 
          p.categoria?.toLowerCase().includes(q)
      );
    }

    // Sort by proximity if we have user location
    if (ubicacionUsuario) {
      result.sort((a, b) =>
        haversine(ubicacionUsuario, [a.latitud, a.longitud]) -
        haversine(ubicacionUsuario, [b.latitud, b.longitud])
      );
    }

    setFilteredPois(result);
  }, [activeFilter, searchQuery, allPois, soloAbiertos, ubicacionUsuario]);

  /* ── Init map ── */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-99.1332, 19.4326],
      zoom: 11.5,
      preserveDrawingBuffer: true,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), "top-right");
    map.on("style.load", () => applyMuulMapStyle(map));
    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ── User location (real-time) ── */
  useEffect(() => {
    if (!mapLoaded) return;
    if (!navigator.geolocation) return;

    const params = new URLSearchParams(window.location.search);
    const hasTarget = !!(params.get("lat") && params.get("lng"));

    const onSuccess = (pos: GeolocationPosition) => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUbicacionUsuario(coords);

      // centrar solo una vez si no hay target en URL
      if (!hasTarget && mapRef.current && !centeredOnceRef.current) {
        mapRef.current.flyTo({ center: [coords[1], coords[0]], zoom: 14, duration: 1200 });
        centeredOnceRef.current = true;
      }
    };

    const onError = () => {
      // fallback solo si aún no hay ubicación
      setUbicacionUsuario((prev) => prev ?? [19.4326, -99.1332]);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    userWatchIdRef.current = navigator.geolocation.watchPosition(onSuccess, () => {}, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
    });

    return () => {
      if (userWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(userWatchIdRef.current);
        userWatchIdRef.current = null;
      }
    };
  }, [mapLoaded]);

  /* ── Target focus from URL ── */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const lat = params.get("lat") || params.get("latitud");
    const lng = params.get("lng") || params.get("longitud");
    const id = params.get("id") || params.get("poi") || params.get("negocio_id");
    const filter = params.get("filter");

    if (filter) {
      setActiveFilter(filter);
    }

    if (lat && lng) {
      const qLat = parseFloat(lat);
      const qLng = parseFloat(lng);
      
      if (!isNaN(qLat) && !isNaN(qLng)) {
        mapRef.current.flyTo({
          center: [qLng, qLat],
          zoom: 17,
          duration: 1500,
          essential: true
        });

        if (id) {
          const found = allPois.find((p) => p.id === id);
          if (found) {
            setSelectedPoi(found);
            setMobileSheetOpen(false);
          }
        }
      }
    }
  }, [mapLoaded, allPois.length]);

  /* ── Route toggle ── */
  const togglePoiEnRuta = useCallback((poi: POI) => {
    setPoisEnRuta((prev) => {
      const exists = prev.find((p) => p.id === poi.id);
      if (exists) return prev.filter((p) => p.id !== poi.id);
      if (prev.length >= 12) return prev;
      return [...prev, poi];
    });
    setMostrarItinerario(false);
    mapboxOpt.clearRoute();
    accessibleRoute.clearRoute();
    metroRoute.clearRoute();
    mapboxOpt.setError("");
  }, [metroRoute]);

  const handleSelectPoi = useCallback((poi: POI) => {
    setSelectedPoi(poi);
    mapRef.current?.flyTo({ center: [poi.longitud, poi.latitud], zoom: 14, duration: 1000 });
  }, []);

  /* ── Calculate route ── */
  const calcularRuta = async (overridePois?: POI[]) => {
    const targetPois = overridePois || poisEnRuta;
    if (targetPois.length < 1) {
      mapboxOpt.setError(t("errorMinPuntos"));
      return;
    }

    // Forzar que la primera parada sea la más cercana al usuario
    const poisBase = ordenarPorCercaniaAlOrigen(targetPois, ubicacionUsuario);

    if (isAccessibleMode) {
      const result = await accessibleRoute.calculateAccessibleRoute(poisBase, ubicacionUsuario);
      if (result) {
        setPoisEnRuta(poisBase);
        setMostrarItinerario(true);
        setMobileSheetOpen(false);
        setShowAccessibilityFeatures(false);
        if (mapRef.current) {
          const bounds = new mapboxgl.LngLatBounds();
          (result.geometry.coordinates as [number, number][]).forEach((c) => bounds.extend(c));
          mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });
        }
      }
    } else if (isMetroMode) {
      const result = await metroRoute.calculateMetroRoute(poisBase, ubicacionUsuario);
      if (result) {
        setPoisEnRuta(poisBase);
        setMostrarItinerario(true);
        setMobileSheetOpen(false);
        if (mapRef.current) {
          const bounds = new mapboxgl.LngLatBounds();
          (result.geometry.coordinates as [number, number][]).forEach((c) => bounds.extend(c));
          mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });
        }
      }
    } else {
      const result = await mapboxOpt.calculateRoute(
        poisBase,
        ubicacionUsuario,
        transportMode as TransportMode
      );
      if (result) {
        setPoisEnRuta(result.orderedPois);
        setMostrarItinerario(true);
        setMobileSheetOpen(false);
      }
    }
  };

  const limpiarRuta = () => {
    setPoisEnRuta([]);
    mapboxOpt.clearRoute();
    accessibleRoute.clearRoute();
    metroRoute.clearRoute();
    setMostrarItinerario(false);
    setSavedRouteIdForParty(undefined);
    clearMapRoutes();
  };

  const clearMapRoutes = () => {
    if (!mapRef.current) return;
    ["main-glow", "main-base", "main-dash", "route-markers-circles", "route-markers-labels"].forEach((id) => {
      if (mapRef.current!.getLayer(id)) mapRef.current!.removeLayer(id);
    });
    ["main-route", "route-markers-source"].forEach((id) => {
      if (mapRef.current!.getSource(id)) mapRef.current!.removeSource(id);
    });
  };

  /* ── Save route ── */
  const guardarRuta = async () => {
    if (guardando) return;
    setGuardando(true);
    setGuardadoMsg(t("guardando") + "...");

    // Backup reset to avoid getting stuck
    const securityTimeout = setTimeout(() => {
      setGuardando(false);
      setGuardadoMsg("✕ Error: Timeout");
      setTimeout(() => setGuardadoMsg(""), 3000);
    }, 8000);

    try {
      if (!userInfo) {
        clearTimeout(securityTimeout);
        setGuardadoMsg(t("loginParaGuardar"));
        setGuardando(false);
        setTimeout(() => setGuardadoMsg(""), 3000);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        clearTimeout(securityTimeout);
        setGuardadoMsg(t("loginParaGuardar"));
        setGuardando(false);
        setTimeout(() => setGuardadoMsg(""), 3000);
        return;
      }

      if (poisEnRuta.length === 0 || !activeRoute) {
        clearTimeout(securityTimeout);
        setGuardadoMsg(t("errorMinPuntos"));
        setGuardando(false);
        return;
      }

      const nombreRuta = `${t("itinerario")} — ${new Date().toLocaleDateString()}`;
      
      const payload = {
        usuario_id: user.id,
        nombre: nombreRuta,
        pois_ids: poisEnRuta.map(p => p.id),
        pois_data: poisEnRuta.map(p => ({
          id: p.id,
          nombre: p.nombre,
          emoji: p.emoji,
          categoria: p.categoria
        })),
        distancia_texto: activeRoute.distancia_texto,
        duracion_texto: activeRoute.duracion_texto,
        es_publica: false
      };

      const { error, isLocal } = (await safeInsertRuta(supabase, payload)) as any;

      clearTimeout(securityTimeout);

      if (error) throw error;

      setGuardadoMsg(isLocal ? "✓ " + t("rutaGuardada") + " (Local)" : "✓ " + t("rutaGuardada"));
      setTimeout(() => {
        setGuardando(false);
        setGuardadoMsg("");
        cargarRutasGuardadas();
      }, 1000);

    } catch (err: any) {
      clearTimeout(securityTimeout);
      console.error("Error saving route:", err);
      setGuardadoMsg("✕ Error: " + (err.message || "DB"));
      setGuardando(false);
      setTimeout(() => setGuardadoMsg(""), 4000);
    }
  };

  const cargarRutasGuardadas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let allMergedRoutes: any[] = [];
    
    // 1. Get from Supabase
    if (user) {
      const { data: dbData } = await supabase.from("rutas_guardadas").select("*").eq("usuario_id", user.id).order("created_at", { ascending: false });
      if (dbData) allMergedRoutes = [...dbData];
    }

    // 2. Merge with Local (resilience mode)
    try {
      const localData = JSON.parse(localStorage.getItem("muul_local_routes") || "[]");
      // Filter out those already in DB if they were synced (future)
      allMergedRoutes = [...localData, ...allMergedRoutes];
    } catch (e) {}

    setRutasGuardadas(allMergedRoutes);
    setMostrarGuardadas(true);
  };

  const eliminarRutaGuardada = async (id: string | number) => {
    if (String(id).startsWith("local_")) {
      const localData = JSON.parse(localStorage.getItem("muul_local_routes") || "[]");
      localStorage.setItem("muul_local_routes", JSON.stringify(localData.filter((r: any) => r.id !== id)));
    } else {
      await supabase.from("rutas_guardadas").delete().eq("id", id);
    }
    setRutasGuardadas((prev) => prev.filter((r) => r.id !== id));
  };

  const cargarRutaEnMapa = async (pois_info: any[]) => {
    if (!pois_info || pois_info.length === 0) return;
    
    // Resolve full objects from IDs or partial objects
    const poisParaRuta = pois_info.map((item) => {
      const targetId = typeof item === 'string' ? item : (item.id || item);
      return allPois.find((p) => p.id === targetId);
    }).filter(Boolean) as POI[];

    if (poisParaRuta.length < 1) {
      mapboxOpt.setError(t("errorMinPuntos"));
      return;
    }

    // 1. Sync state
    setPoisEnRuta(poisParaRuta);
    setMostrarGuardadas(false);
    setMostrarItinerario(true);
    setMobileSheetOpen(false);

    // 2. Clear previous and calculate new immediately
    mapboxOpt.clearRoute();
    accessibleRoute.clearRoute();
    metroRoute.clearRoute();
    
    // Tiny delay to ensure state starts transition, but we use direct reference for calculation
    setTimeout(() => {
      calcularRuta(poisParaRuta);
    }, 100);
  };

  /* ── Sorpréndeme ── */
  const handleSorprendeme = async () => {
    if (!ubicacionUsuario) {
      mapboxOpt.setError(t("requireUserLocation"));
      return;
    }

    const currentZoom = mapRef.current?.getZoom() ?? 14;

    // 1️⃣ Generar POIs aleatorios (nueva lista cada vez)
    const poisSeleccionados = await sorprendeme.generarRutaAleatoria(
      allPois,
      ubicacionUsuario,
      {
        categoria: activeFilter,
        soloAbiertos: false,
        cantidad: 8,
        currentZoom,
      }
    );

    if (!poisSeleccionados || poisSeleccionados.length === 0) {
      mapboxOpt.setError(t("noNearbyPlaces"));
      return;
    }

    // 2️⃣ ✅ REEMPLAZAR completamente la ruta anterior
    setPoisEnRuta(poisSeleccionados);

    // 3️⃣ Limpiar rutas previas
    clearMapRoutes();
    mapboxOpt.clearRoute();
    accessibleRoute.clearRoute();
    metroRoute.clearRoute();
    setMostrarItinerario(false);

    // 4️⃣ Hacer scroll al listado (mobile)
    if (itinerarioRef.current) {
      itinerarioRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ── Share helpers ── */
  const copiarItinerario = () => {
    if (poisEnRuta.length === 0 || !activeRoute) return;
    const horas = calcularHorasLlegada(poisEnRuta, activeRoute.duracion_segundos);
    let texto = `🗺️ MUUL — ${t("itinerario")}${isAccessibleMode ? " ♿ ACCESIBLE" : ""}\n`;
    texto += `📏 ${activeRoute.distancia_texto} · ⏱ ${activeRoute.duracion_texto}\n\n`;
    if (isMetroMode && metroRoute.route?.instructions.length) {
      texto += `${t("metroMode")}\n`;
      metroRoute.route.instructions.forEach((ins) => {
        if (ins.type === "walk_to_board") {
          texto += `- ${t("metroWalkToBoard", { station: ins.station || "", min: ins.minutes || 0 })}\n`;
        } else if (ins.type === "board") {
          texto += `- ${t("metroBoardLine", { line: ins.line || "", station: ins.station || "", direction: ins.direction || "" })}\n`;
        } else if (ins.type === "transfer") {
          texto += `- ${t("metroTransfer", { station: ins.station || "", line: ins.line || "" })}\n`;
        } else {
          texto += `- ${t("metroExitWalk", { station: ins.station || "", min: ins.minutes || 0 })}\n`;
        }
      });
      texto += "\n";
    }
    poisEnRuta.forEach((poi, i) => {
      texto += `${i + 1}. ${poi.emoji || "📍"} ${poi.nombre}\n   🕐 ~${horas[i]} · ⏱ ${DURACION_VISITA[poi.categoria] || 30} min\n`;
    });
    if (isAccessibleMode && accessibleRoute.route?.warnings.length) {
      texto += `\n⚠️ Avisos:\n${accessibleRoute.route.warnings.join("\n")}\n`;
    }
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
    if (poisEnRuta.length === 0 || !activeRoute) return;
    const nombres = poisEnRuta.map((p) => `${p.emoji || "📍"} ${p.nombre}`).join(" → ");
    if (navigator.share) {
      try { await navigator.share({ title: "Muul", text: `🗺️ ${nombres}\n📏 ${activeRoute.distancia_texto} · ⏱ ${activeRoute.duracion_texto}` }); }
      catch {}
    } else { copiarItinerario(); }
  };

  const publicarEnComunidad = async () => {
    if (poisEnRuta.length === 0 || !activeRoute || !itinerarioRef.current) return;
    
    if (!userInfo) {
      setGuardadoMsg(t("loginParaGuardar"));
      setTimeout(() => setGuardadoMsg(""), 3000);
      return;
    }

    setGuardadoMsg(t("generandoImagen") + "...");
    setGuardando(true);

    try {
      // 1. Capture the map journey as an image
      if (!mapRef.current) throw new Error("Mapa no listo");
      
      const mapCanvas = mapRef.current.getCanvas();
      const mapImageData = mapCanvas.toDataURL("image/png");
      
      // 2. Prepare the post data to send via draft
      const nombres = poisEnRuta.map(p => p.nombre).join(" → ");
      const text = `🗺️ ¡Acabo de crear una nueva ruta en Muul! 📍 Recorrido: ${nombres}\n📏 Distancia: ${activeRoute.distancia_texto} ⏱️ Tiempo estimado: ${activeRoute.duracion_texto}\n\n#Muul #Aventura #Turismo`;

      // 3. Save to draft in sessionStorage
      sessionStorage.setItem("muul_draft_text", text);
      sessionStorage.setItem("muul_draft_image", mapImageData);
      
      setGuardadoMsg("✨ Preparando borrador...");
      setTimeout(() => {
        router.push("/comunidad?draft=true");
      }, 1000);
    } catch (error) {
      console.error("Error al preparar borrador:", error);
      setGuardadoMsg("❌ Error al preparar borrador");
    } finally {
      setGuardando(false);
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
      const isFromSupabase = !String(poi.id).startsWith("mapbox_");
      const color = getMarkerColor(poi.categoria);
      const wrapper = document.createElement("div");
      const circle = document.createElement("div");
      circle.style.cssText = `width:40px;height:40px;border-radius:50%;background:#ffffff;border:3px solid ${isInRouteFlag ? "#98d5a2" : color};display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;box-shadow:${isInRouteFlag ? "0 0 16px rgba(152,213,162,0.5)" : "0 4px 12px rgba(0,0,0,0.4)"};transition:transform 0.2s;position:relative;${!isFromSupabase ? "opacity:0.7;" : ""}`;
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
        .setLngLat([poi.longitud, poi.latitud]).addTo(mapRef.current!);
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
      const userMarker = new mapboxgl.Marker({ element: userEl, anchor: "center" })
        .setLngLat([ubicacionUsuario[1], ubicacionUsuario[0]]).addTo(mapRef.current);
      markersRef.current.push(userMarker);
    }
  }, [filteredPois, mapLoaded, poisEnRuta, handleSelectPoi, ubicacionUsuario]);

  /* ── Draw route on map ── */
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (animationRef.current !== null) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    clearMapRoutes();
    if (!activeRoute) return;

    const color = getRouteColorForMode(transportMode);
    mapRef.current.addSource("main-route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: activeRoute.geometry },
    });

    if (isAccessibleMode) {
      // ✅ Accesible: solo azul
      mapRef.current.addLayer({
        id: "main-glow",
        type: "line",
        source: "main-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#003e6f", "line-width": 16, "line-opacity": 0.18, "line-blur": 8 }
      });
      mapRef.current.addLayer({
        id: "main-base",
        type: "line",
        source: "main-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#003e6f", "line-width": 7, "line-opacity": 1 }
      });
      mapRef.current.addLayer({
        id: "main-dash",
        type: "line",
        source: "main-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#003e6f", "line-width": 3, "line-opacity": 0.45, "line-dasharray": [2, 3] }
      });
    } else {
      mapRef.current.addLayer({ id: "main-glow", type: "line", source: "main-route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": color, "line-width": 14, "line-opacity": 0.2, "line-blur": 8 } });
      mapRef.current.addLayer({ id: "main-base", type: "line", source: "main-route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": color, "line-width": 5, "line-opacity": 0.9 } });
      mapRef.current.addLayer({ id: "main-dash", type: "line", source: "main-route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#ffffff", "line-width": 2, "line-opacity": 0.6, "line-dasharray": [0, 4, 3] } });

      const dashSteps = [[0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],[3,4,0],[0,3,3]];
      let step = 0, lastTime = 0;
      const animate = (ts: number) => {
        if (!mapRef.current) return;
        if (ts - lastTime >= 80) {
          if (mapRef.current.getLayer("main-dash")) mapRef.current.setPaintProperty("main-dash", "line-dasharray", dashSteps[step]);
          step = (step + 1) % dashSteps.length;
          lastTime = ts;
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    // ✅ Add markers for the photo/capture
    const markersGeoJSON: any = {
      type: "FeatureCollection",
      features: poisEnRuta.map((poi, idx) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [poi.longitud, poi.latitud] },
        properties: { index: (idx + 1).toString() }
      }))
    };

    mapRef.current.addSource("route-markers-source", { type: "geojson", data: markersGeoJSON });
    
    mapRef.current.addLayer({
      id: "route-markers-circles",
      type: "circle",
      source: "route-markers-source",
      paint: {
        "circle-radius": 12,
        "circle-color": color,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    });

    mapRef.current.addLayer({
      id: "route-markers-labels",
      type: "symbol",
      source: "route-markers-source",
      layout: {
        "text-field": ["get", "index"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
        "text-allow-overlap": true
      },
      paint: {
        "text-color": "#ffffff"
      }
    });

    const bounds = new mapboxgl.LngLatBounds();
    (activeRoute.geometry.coordinates as [number, number][]).forEach((c) => bounds.extend(c));
    mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });

    return () => { if (animationRef.current !== null) { cancelAnimationFrame(animationRef.current); animationRef.current = null; } };
  }, [activeRoute, mapLoaded, transportMode, isAccessibleMode]);

  const isInRoute = (poi: POI) => poisEnRuta.some((p) => p.id === poi.id);
  const formatHours = (poi: POI) => {
    if (!poi.horario_apertura || !poi.horario_cierre) return t("horarioNoDisponible");
    return `${t("abierto")} · ${t("cierra", { hora: poi.horario_cierre })}`;
  };

  /* ── Accessibility score badge ── */
  const AccessibilityScoreBadge = ({ score }: { score: number }) => {
    const color = score >= 70 ? "#98d5a2" : score >= 40 ? "#fed000" : "#ffb3b3";
    const label = score >= 70 ? t("accessibilityHigh") : score >= 40 ? t("accessibilityMedium") : t("accessibilityLow");
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: `${color}30`, border: `1px solid ${color}` }}>
        <span className="text-xs">♿</span>
        <div>
          <p className="text-[8px] font-black uppercase text-[#003e6f]">{t("accessibilityLabel")}</p>
          <p className="text-[10px] font-black text-[#003e6f]">{label} · {score}/100</p>
        </div>
      </div>
    );
  };

  // Helper: is this POI from Supabase (verified) or Mapbox (external)?
  const isVerifiedPoi = (poi: POI) => !String(poi.id).startsWith("mapbox_");

  /* ═══════════════════════════════════════
     RENDER — identical JSX to your current version,
     only data source changed (allPois instead of pois/mapboxPois split)
  ═══════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col overflow-hidden pt-[80px] bg-surface text-on-surface font-body">
      <main className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
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
          <button onClick={() => setPartyModalOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest/50 transition-all" title={t("partyMode")}>
            <span className="material-symbols-outlined">celebration</span>
          </button>
          <button
            onClick={() => setTransportMode(isAccessibleMode ? "walking" : "accessible")}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isAccessibleMode ? "bg-[#fed000] text-[#003e6f] shadow-lg" : "text-on-surface-variant hover:bg-surface-container-highest/50"}`}
            title={t("accessibleMode")}
          >
            <span className="material-symbols-outlined" style={isAccessibleMode ? { fontVariationSettings: "'FILL' 1" } : undefined}>accessible</span>
          </button>
        </aside>

        <div className="flex-1 flex overflow-hidden">

          {/* ── Desktop left panel ── */}
          <div className="hidden md:flex w-[360px] flex-col bg-surface-container-lowest relative z-30 border-r border-outline-variant/10">
            {!mostrarItinerario ? (
              <>
                {isAccessibleMode && (
                  <div className="mx-4 mb-2 p-2.5 rounded-xl bg-[#fed000]/20 border border-[#fed000]/40 flex items-center gap-2">
                    <span className="text-lg">♿</span><p className="flex-1 text-[10px] font-bold text-[#003e6f]">{t("accessibleMode")}</p>
                    <button onClick={() => setTransportMode("walking")} className="text-on-surface-variant"><span className="material-symbols-outlined text-sm">close</span></button>
                  </div>
                )}

                <div className="p-6 space-y-4">
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">search</span>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("buscar")}
                      className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40 transition-all" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {filters.map((f) => (
                      <button key={f.value} onClick={() => setActiveFilter(f.value)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${activeFilter === f.value ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface hover:bg-surface-bright"}`}>
                        {f.label} <span className="text-xs">{f.emoji}</span>
                      </button>
                    ))}
                    <button onClick={() => { setSoloAbiertos(!soloAbiertos); if (!mobileSheetOpen) setMobileSheetOpen(true); }} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${soloAbiertos ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface hover:bg-surface-bright"}`}>
                      <span className="material-symbols-outlined text-sm">schedule</span>{t("abiertos")}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2" style={{ scrollbarWidth: "none" }}>
                  {!initialLoadDone || buscandoExternos ? (
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
                      const verified = isVerifiedPoi(poi);
                      return (
                        <div key={poi.id} className={`p-4 rounded-xl flex items-start gap-4 transition-all ${selectedPoi?.id === poi.id ? "bg-surface-container-high border-l-4 border-secondary" : "hover:bg-surface-container-high"}`}>
                          <button onClick={() => handleSelectPoi(poi)} className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl shadow-inner shrink-0">{poi.emoji || "📍"}</button>
                          <button onClick={() => handleSelectPoi(poi)} className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-headline font-bold text-on-surface truncate">{poi.nombre}</h3>
                              {verified && (poi as any).verificado && (
                                <span className="text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>Muul
                                </span>
                              )}
                              {!verified && (
                                <span className="text-[9px] font-bold text-on-surface-variant bg-surface-container-highest px-1 py-0.5 rounded">{t("externalSource")}</span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              <span className={isOpenNow(poi) ? "text-secondary" : "text-tertiary"}>● </span>{formatHours(poi)}
                            </p>
                          </button>
                          <button onClick={() => togglePoiEnRuta(poi)}
                            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all ${inRoute ? "bg-secondary text-on-secondary shadow-glow-secondary" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"}`}>
                            {inRoute ? routeNum : <span className="material-symbols-outlined text-lg">add_location</span>}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 space-y-3">
                  {activeError && (
                    <div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium animate-fade-in-up">{activeError}</div>
                  )}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${poisEnRuta.length > 0 ? (isAccessibleMode ? "bg-[#fed000]" : "bg-secondary") + " animate-pulse" : "bg-on-surface-variant"}`} />
                      <span className="text-sm font-bold text-on-surface">
                        {poisEnRuta.length === 1 ? t("paradas", { count: 1 }) : t("paradasPlural", { count: poisEnRuta.length })}
                        <span className="text-on-surface-variant font-normal text-xs ml-1">{t("maxStops")}</span>
                      </span>
                    </div>
                    {poisEnRuta.length > 0 && (
                      <button onClick={limpiarRuta} className="text-xs text-on-surface-variant hover:text-tertiary transition-colors font-bold">{t("limpiar")}</button>
                    )}
                  </div>
                  <TransportSelector value={transportMode} onChange={setTransportMode} enableMetro={metroEnabled} />
                  <div className="flex gap-2">
                    <button onClick={() => calcularRuta()} disabled={poisEnRuta.length < 1 || activeLoading}
                      className={`flex-1 py-4 rounded-xl font-headline font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${isAccessibleMode ? "bg-[#fed000] text-[#003e6f] shadow-[#fed000]/20 hover:bg-yellow-400" : "bg-secondary hover:bg-secondary-fixed text-on-secondary shadow-secondary/10"}`}>
                      {activeLoading ? (isAccessibleMode ? t("analyzingAccessible") : t("calculando")) : (isAccessibleMode ? t("accessibleRouteCta") : isMetroMode ? t("metroRouteCta") : t("calcularRuta"))}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Itinerary view ── */
              <>
                <div ref={itinerarioRef} className="flex flex-col flex-1 overflow-hidden bg-surface-container-lowest">
                  <div className="p-6 border-b border-outline-variant/10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-headline font-black text-on-surface text-sm uppercase tracking-widest flex items-center gap-2">
                        {isAccessibleMode && <span>♿</span>}{t("itinerario")}
                      </h2>
                      <button onClick={() => setMostrarItinerario(false)} className="text-xs text-on-surface-variant hover:text-on-surface font-bold flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-sm">arrow_back</span> {t("volver")}
                      </button>
                    </div>
                    {activeRoute && (
                      <div className={`p-3 rounded-xl flex items-center gap-3 ${isAccessibleMode ? "bg-[#fed000]/20 border border-[#fed000]/30" : isMetroMode ? "bg-[#e11d8a]/10 border border-[#e11d8a]/30" : "bg-surface-container-high"}`}>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getRouteColorForMode(transportMode) }} />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-on-surface capitalize">
                            {transportMode === "walking" ? t("caminando") : transportMode === "cycling" ? t("bicicleta") : transportMode === "metro" ? t("metroMode") : t("vehiculo")}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {activeRoute.distancia_texto} · {activeRoute.duracion_texto}
                            {!isAccessibleMode && ` + ${Math.round(poisEnRuta.reduce((a, p) => a + (DURACION_VISITA[p.categoria] || 30), 0))} ${t("visitsMinutes")}`}
                          </p>
                        </div>
                        {isAccessibleMode && accessibleRoute.route
                          ? <AccessibilityScoreBadge score={accessibleRoute.route.accessibilityScore} />
                          : <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded uppercase">{t("optimal")}</span>}
                      </div>
                    )}
                    {isAccessibleMode && accessibleRoute.route?.warnings.length ? (
                      <div className="mt-3 space-y-1.5">
                        {accessibleRoute.route.warnings.map((w, i) => (
                          <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{w}</div>
                        ))}
                      </div>
                    ) : null}
                    {isMetroMode && metroRoute.route?.instructions.length ? (
                      <div className="mt-3 space-y-1.5">
                        {metroRoute.route.instructions.map((ins, i) => {
                          if (ins.type === "walk_to_board") {
                            return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroWalkToBoard", { station: ins.station || "", min: ins.minutes || 0 })}</div>;
                          }
                          if (ins.type === "board") {
                            return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroBoardLine", { line: ins.line || "", station: ins.station || "", direction: ins.direction || "" })}</div>;
                          }
                          if (ins.type === "transfer") {
                            return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroTransfer", { station: ins.station || "", line: ins.line || "" })}</div>;
                          }
                          return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroExitWalk", { station: ins.station || "", min: ins.minutes || 0 })}</div>;
                        })}
                      </div>
                    ) : null}
                    {isAccessibleMode && accessibleRoute.route && (
                      <button onClick={() => setShowAccessibilityFeatures((v) => !v)}
                        className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-high text-xs font-bold text-on-surface hover:bg-surface-bright transition-all">
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">layers</span>{t("accessibilityFeaturesToggle")}</span>
                        <span className={`w-8 h-4 rounded-full transition-colors relative ${showAccessibilityFeatures ? "bg-[#fed000]" : "bg-surface-container-highest"}`}>
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showAccessibilityFeatures ? "left-4" : "left-0.5"}`} />
                        </span>
                      </button>
                    )}
                    {isAccessibleMode && accessibleRoute.route && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {[{ type: "ramp", emoji: "♿", label: t("featureRamps") }, { type: "elevator", emoji: "🛗", label: t("featureElevators") }, { type: "accessible_crossing", emoji: "🚶", label: t("featureCrossings") }, { type: "tactile_paving", emoji: "🟡", label: t("featureTactile") }].map(({ type, emoji, label }) => {
                          const count = accessibleRoute.route!.accessibilityFeatures.filter((f) => f.type === type).length;
                          if (count === 0) return null;
                          return <span key={type} className="text-[9px] font-black bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">{emoji} {count} {label}</span>;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">{t("paradasTitulo")}</h3>
                    {isMetroMode && metroRoute.route?.instructions.length ? (
                      <div className="mb-4 p-3 rounded-xl border border-[#e11d8a]/30 bg-[#e11d8a]/10 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wider text-[#9d174d]">{t("metroMode")}</p>
                        <div className="space-y-1.5">
                          {metroRoute.route.instructions.map((ins, i) => {
                            if (ins.type === "walk_to_board") {
                              return <p key={i} className="text-[11px] font-medium text-on-surface">{t("metroWalkToBoard", { station: ins.station || "", min: ins.minutes || 0 })}</p>;
                            }
                            if (ins.type === "board") {
                              return <p key={i} className="text-[11px] font-medium text-on-surface">{t("metroBoardLine", { line: ins.line || "", station: ins.station || "", direction: ins.direction || "" })}</p>;
                            }
                            if (ins.type === "transfer") {
                              return <p key={i} className="text-[11px] font-medium text-on-surface">{t("metroTransfer", { station: ins.station || "", line: ins.line || "" })}</p>;
                            }
                            return <p key={i} className="text-[11px] font-medium text-on-surface">{t("metroExitWalk", { station: ins.station || "", min: ins.minutes || 0 })}</p>;
                          })}
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-4 relative">
                      <div className="absolute left-[11px] top-4 bottom-4 w-px bg-outline-variant/30" />
                      {ubicacionUsuario && (
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/20">
                            <span className="material-symbols-outlined text-secondary text-[12px]">my_location</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-on-surface font-medium block">{t("tuUbicacion")}</span>
                            <span className="text-[10px] text-secondary">{t("puntoPartida")}</span>
                          </div>
                        </div>
                      )}
                      {poisEnRuta.map((poi, i) => (
                        <div key={poi.id} className="flex items-center gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black bg-surface-container-highest shrink-0" style={{ borderColor: getRouteColorForMode(transportMode) }}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-on-surface font-medium truncate block">{poi.nombre}</span>
                            <span className="text-[10px] text-on-surface-variant">
                              {t("llegada", { hora: calcularHorasLlegada(poisEnRuta, activeRoute?.duracion_segundos ?? 0)[i] })} · {t("minVisita", { min: DURACION_VISITA[poi.categoria] || 30 })}
                            </span>
                          </div>
                          <span className="text-lg shrink-0">{poi.emoji}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 space-y-3">
                  {guardadoMsg && <p className={`text-xs font-bold text-center animate-fade-in-up ${guardadoMsg.includes("Error") ? "text-error" : "text-secondary"}`}>{guardadoMsg}</p>}
                  <div className="relative">
                    <button onClick={() => setCompartirMenuOpen((v) => !v)} className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-surface-bright transition-all uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">share</span>{t("compartir")}
                    </button>
                    {compartirMenuOpen && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        <button onClick={() => { copiarItinerario(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface"><span className="material-symbols-outlined text-base">content_copy</span>{t("copiar")}</button>
                        <button onClick={() => { descargarImagen(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface"><span className="material-symbols-outlined text-base">download</span>{t("imagen")}</button>
                        <button onClick={() => { compartirRuta(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface"><span className="material-symbols-outlined text-base">open_in_new</span>{t("compartirApps")}</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setPartyModalOpen(true)} className="w-full bg-gradient-to-r from-secondary/20 to-primary/10 text-on-surface py-3 rounded-xl font-headline font-bold text-sm border border-secondary/20 flex items-center justify-center gap-2"><span className="text-base">🎉</span> {t("partyMode")}</button>
                  <button 
                    onClick={publicarEnComunidad}
                    disabled={guardando || poisEnRuta.length === 0}
                    className="w-full bg-[#003e6f] !text-white py-3 rounded-xl font-headline font-black text-sm uppercase tracking-widest hover:bg-[#005596] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#003e6f]/20 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">public</span> 
                    {guardando ? "Publicando..." : t("publishCommunity")}
                  </button>
                  <button onClick={guardarRuta} disabled={guardando} className="w-full bg-[#003e6f] !text-white py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    <span>{guardando ? t("guardando") : t("guardarRuta")}</span>
                  </button>
                  <button onClick={limpiarRuta} className="w-full border border-tertiary/30 text-tertiary py-2.5 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:bg-tertiary/10 transition-all">{t("nuevaRuta")}</button>
                </div>
              </>
            )}
          </div>

          {/* ── Map area ── */}
          <div className="flex-1 relative overflow-hidden">
            <div ref={mapContainer} className="absolute inset-0" />

            {/* ✅ Sorpréndeme en mapa (botón amarillo con dado) */}
            <button
              onClick={handleSorprendeme}
              disabled={sorprendeme.loading || activeLoading || !ubicacionUsuario}
              className="absolute top-20 md:top-4 left-4 z-30 h-12 px-5 rounded-2xl bg-[#fed000] text-[#003e6f] shadow-lg border border-[#e6c200] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={t("sorprendeme")}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                casino
              </span>
              <span className="text-xs font-black uppercase tracking-wider">{t("sorprendeme")}</span>
            </button>

            {/* Accessibility features on map */}
            <AccessibilityFeaturesLayer
              map={mapRef.current}
              features={isAccessibleMode && accessibleRoute.route ? accessibleRoute.route.accessibilityFeatures : []}
              visible={showAccessibilityFeatures && isAccessibleMode}
              routeCoordinates={activeRoute?.geometry.coordinates as [number, number][]}
            />

            {/* Sticky AI button only on map */}
            <button
              onClick={() => {
                setChatbotAbierto(true);
                setMobileSheetOpen(false);
              }}
              className="absolute bottom-[12rem] right-4 md:bottom-6 md:right-6 z-[45] h-14 px-5 rounded-full bg-[#fed000] text-[#003e6f] shadow-xl shadow-[#fed000]/30 hover:brightness-95 transition-colors flex items-center gap-2"
              aria-label={t("openMuulAi")}
              title={t("openMuulAi")}
            >
              <span className="w-6 h-6 rounded-full border border-[#003e6f]/70 flex items-center justify-center text-[11px] leading-none text-[#003e6f]" aria-hidden="true">
                ✦
              </span>
              <span className="font-label text-[11px] font-black tracking-[0.18em] text-[#003e6f]">
                MUUL AI
              </span>
            </button>

            {/* POI card — enhanced with photo */}
            {selectedPoi && !mostrarItinerario && (
              <POICard poi={selectedPoi} isInRoute={isInRoute(selectedPoi)} routeIndex={poisEnRuta.findIndex((p) => p.id === selectedPoi.id)} onClose={() => setSelectedPoi(null)} onToggleRoute={togglePoiEnRuta} onAskAI={() => { setChatbotAbierto(true); setMobileSheetOpen(false); }} t={t} />
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
                <button onClick={() => setMostrarGuardadas(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">close</span></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
                {rutasGuardadas.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-12 space-y-3"><span className="text-4xl">🗺️</span><p className="text-on-surface-variant text-sm">{t("sinRutas")}</p></div>
                ) : rutasGuardadas.map((ruta) => (
                  <div key={ruta.id} className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1 mb-1 items-center flex-wrap">
                          {ruta.pois_data?.map((p: any, i: number) => (<span key={i} className="text-lg">{p.emoji}</span>))}
                          {ruta.es_publica && <span className="text-[9px] font-black text-secondary bg-secondary/10 px-1.5 py-0.5 rounded uppercase">Party</span>}
                          {ruta.es_accesible && <span className="text-[9px] font-black text-[#003e6f] bg-[#fed000]/30 px-1.5 py-0.5 rounded uppercase">♿ Accesible</span>}
                        </div>
                        <p className="text-xs text-on-surface font-bold truncate">{ruta.nombre}</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">{ruta.distancia_texto} · {ruta.duracion_texto}</p>
                      </div>
                      <button onClick={() => eliminarRutaGuardada(ruta.id)} className="text-on-surface-variant hover:text-tertiary transition-colors shrink-0"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => cargarRutaEnMapa(ruta.pois_data)} className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-lg text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all">{t("cargarMapa")}</button>
                      {!ruta.es_publica && (
                        <button onClick={() => { setSavedRouteIdForParty(ruta.id); setPartyModalOpen(true); setMostrarGuardadas(false); }} className="px-3 py-2.5 rounded-lg text-xs font-black bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-all" title="Party Mode">🎉</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <PartyModeModal
          isOpen={partyModalOpen}
          onClose={() => { setPartyModalOpen(false); setSavedRouteIdForParty(undefined); }}
          savedRouteId={savedRouteIdForParty}
          poisEnRuta={poisEnRuta}
          distanciaTexto={activeRoute?.distancia_texto}
          duracionTexto={activeRoute?.duracion_texto}
          onLoadRoute={(pois_data) => cargarRutaEnMapa(pois_data)}
        />

        <ChatModal
          isOpen={chatbotAbierto}
          onClose={() => setChatbotAbierto(false)}
          poi={selectedPoi}
          poisEnRuta={poisEnRuta}
          lugaresCercanos={lugaresCercanosMuul}
          totalVisibles={filteredPois.length}
          idioma={locale}
        />
      </main>

      {/* ═══ MOBILE BOTTOM SHEET ═══ */}
      <div className={`md:hidden fixed inset-x-0 bottom-[60px] z-40 bg-surface-container-low rounded-t-2xl shadow-2xl border-t border-outline-variant/10 flex flex-col transition-all duration-300 ease-in-out ${mobileSheetOpen ? "h-[72vh]" : "h-[160px]"}`}>
        <button onClick={() => setMobileSheetOpen((v) => !v)} className="flex flex-col items-center pt-3 pb-2 w-full shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant mb-2" />
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">{mobileSheetOpen ? "keyboard_arrow_down" : "keyboard_arrow_up"}</span>
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest">{mobileSheetOpen ? t("cerrar") : mostrarItinerario ? t("itinerario") : t("explorar")}</span>
            {poisEnRuta.length > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-secondary text-on-secondary text-[10px] font-black flex items-center justify-center">{poisEnRuta.length}</span>}
            {isAccessibleMode && <span className="text-[9px] font-black bg-[#fed000] text-[#003e6f] px-1.5 py-0.5 rounded">♿</span>}
          </div>
        </button>
        <div className="px-4 pb-3 space-y-2 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (!mobileSheetOpen) setMobileSheetOpen(true); }} placeholder={t("buscar")} className="w-full bg-surface-container-highest border-none rounded-xl py-3 pl-10 pr-4 text-on-surface text-sm placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/40" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {filters.map((f) => (
              <button key={f.value} onClick={() => { setActiveFilter(f.value); if (!mobileSheetOpen) setMobileSheetOpen(true); }} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${activeFilter === f.value ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface"}`}>{f.label} <span>{f.emoji}</span></button>
            ))}
            <button onClick={() => { setSoloAbiertos(!soloAbiertos); if (!mobileSheetOpen) setMobileSheetOpen(true); }} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${soloAbiertos ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface"}`}>
              <span className="material-symbols-outlined text-sm">schedule</span>{t("abiertos")}
            </button>
          </div>
        </div>
        {mobileSheetOpen && (
          <>
            {mostrarItinerario ? (
              <>
                <div className="flex-1 overflow-y-auto px-4 space-y-3" style={{ scrollbarWidth: "none" }}>
                  {activeRoute && (
                    <div className={`p-3 rounded-xl flex items-center gap-3 ${isAccessibleMode ? "bg-[#fed000]/20 border border-[#fed000]/30" : isMetroMode ? "bg-[#e11d8a]/10 border border-[#e11d8a]/30" : "bg-surface-container-high"}`}>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getRouteColorForMode(transportMode) }} />
                      <div className="flex-1"><p className="text-xs font-bold text-on-surface">{isAccessibleMode ? "♿ Accesible" : isMetroMode ? t("metroMode") : transportMode}</p><p className="text-[10px] text-on-surface-variant">{activeRoute.distancia_texto} · {activeRoute.duracion_texto}</p></div>
                      {isAccessibleMode && accessibleRoute.route && <AccessibilityScoreBadge score={accessibleRoute.route.accessibilityScore} />}
                    </div>
                  )}
                  {isAccessibleMode && accessibleRoute.route?.warnings.map((w, i) => (<div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{w}</div>))}
                  {isMetroMode && metroRoute.route?.instructions.map((ins, i) => {
                    if (ins.type === "walk_to_board") {
                      return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroWalkToBoard", { station: ins.station || "", min: ins.minutes || 0 })}</div>;
                    }
                    if (ins.type === "board") {
                      return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroBoardLine", { line: ins.line || "", station: ins.station || "", direction: ins.direction || "" })}</div>;
                    }
                    if (ins.type === "transfer") {
                      return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroTransfer", { station: ins.station || "", line: ins.line || "" })}</div>;
                    }
                    return <div key={i} className="p-2 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant font-medium">{t("metroExitWalk", { station: ins.station || "", min: ins.minutes || 0 })}</div>;
                  })}
                  {isMetroMode && metroRoute.route?.instructions.length ? (
                    <div className="p-2 rounded-lg border border-[#e11d8a]/30 bg-[#e11d8a]/10">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#9d174d]">{t("metroMode")}</p>
                    </div>
                  ) : null}
                  <div className="space-y-3 relative pt-1">
                    <div className="absolute left-[11px] top-4 bottom-4 w-px bg-outline-variant/30" />
                    {ubicacionUsuario && (
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/20 shrink-0"><span className="material-symbols-outlined text-secondary text-[12px]">my_location</span></div>
                        <div className="flex-1 min-w-0"><span className="text-sm text-on-surface font-medium block">{t("tuUbicacion")}</span><span className="text-[10px] text-secondary">{t("puntoPartida")}</span></div>
                      </div>
                    )}
                    {poisEnRuta.map((poi, i) => (
                      <div key={poi.id} className="flex items-center gap-3 relative z-10">
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black bg-surface-container-highest shrink-0" style={{ borderColor: getRouteColorForMode(transportMode) }}>{i + 1}</div>
                        <div className="flex-1 min-w-0"><span className="text-sm text-on-surface font-medium truncate block">{poi.nombre}</span><span className="text-[10px] text-on-surface-variant">{t("llegada", { hora: calcularHorasLlegada(poisEnRuta, activeRoute?.duracion_segundos ?? 0)[i] })} · {t("minVisita", { min: DURACION_VISITA[poi.categoria] || 30 })}</span></div>
                        <span className="text-lg shrink-0">{poi.emoji}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4 pb-4 pt-3 border-t border-outline-variant/10 space-y-2 shrink-0">
                  {guardadoMsg && <p className={`text-xs font-bold text-center ${guardadoMsg.includes("Error") ? "text-error" : "text-secondary"}`}>{guardadoMsg}</p>}
                  <div className="relative">
                    <button onClick={() => setCompartirMenuOpen((v) => !v)} className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-bright transition-all uppercase tracking-wider"><span className="material-symbols-outlined text-sm">share</span>{t("compartir")}</button>
                    {compartirMenuOpen && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        <button onClick={() => { copiarItinerario(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface"><span className="material-symbols-outlined text-base">content_copy</span>{t("copiar")}</button>
                        <button onClick={() => { descargarImagen(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface"><span className="material-symbols-outlined text-base">download</span>{t("imagen")}</button>
                        <button onClick={() => { compartirRuta(); setCompartirMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-highest transition-colors w-full text-left text-sm font-bold text-on-surface"><span className="material-symbols-outlined text-base">open_in_new</span>{t("compartirApps")}</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setPartyModalOpen(true)} className="w-full bg-gradient-to-r from-secondary/20 to-primary/10 text-on-surface py-3 rounded-xl font-headline font-bold text-sm border border-secondary/20 flex items-center justify-center gap-2"><span>🎉</span> {t("partyMode")}</button>
                  <button 
                    onClick={publicarEnComunidad} 
                    disabled={guardando || poisEnRuta.length === 0}
                    className="w-full bg-[#003e6f] !text-white py-3 rounded-xl font-headline font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">public</span>
                    <span className="text-white">{guardando ? "..." : t("publishCommunity")}</span>
                  </button>
                  <button onClick={guardarRuta} disabled={guardando} className="w-full bg-[#003e6f] !text-white py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    <span>{guardando ? t("guardando") : t("guardarRuta")}</span>
                  </button>
                  <button onClick={limpiarRuta} className="w-full border border-tertiary/30 text-tertiary py-2.5 rounded-xl font-headline font-bold text-sm uppercase tracking-widest hover:bg-tertiary/10 transition-all">{t("nuevaRuta")}</button>
                </div>
              </>
            ) : (
              <>
                {isAccessibleMode && (
                  <div className="mx-4 mb-2 p-2.5 rounded-xl bg-[#fed000]/20 border border-[#fed000]/40 flex items-center gap-2">
                    <span className="text-lg">♿</span><p className="flex-1 text-[10px] font-bold text-[#003e6f]">{t("accessibleMode")}</p>
                    <button onClick={() => setTransportMode("walking")} className="text-on-surface-variant"><span className="material-symbols-outlined text-sm">close</span></button>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-4 space-y-2" style={{ scrollbarWidth: "none" }}>
                  {!initialLoadDone || buscandoExternos ? (
                    <div className="space-y-3 p-2">{[1,2,3].map((i) => (<div key={i} className="animate-pulse flex gap-3 p-3"><div className="w-10 h-10 rounded-xl bg-surface-container-high shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-surface-container-high rounded w-3/4" /><div className="h-2 bg-surface-container-high rounded w-1/2" /></div></div>))}</div>
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
                        <div key={poi.id} className={`p-3 rounded-xl flex items-center gap-3 transition-all ${selectedPoi?.id === poi.id ? "bg-surface-container-high border-l-4 border-secondary" : "hover:bg-surface-container-high"}`}>
                          <button onClick={() => { handleSelectPoi(poi); setMobileSheetOpen(false); }} className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-xl shrink-0">{poi.emoji || "📍"}</button>
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
                <div className="px-4 pb-4 pt-3 border-t border-outline-variant/10 space-y-2 shrink-0">
                  {activeError && <div className="p-2 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium">{activeError}</div>}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${poisEnRuta.length > 0 ? (isAccessibleMode ? "bg-[#fed000]" : "bg-secondary") + " animate-pulse" : "bg-on-surface-variant"}`} />
                      <span className="text-xs font-bold text-on-surface">{poisEnRuta.length === 1 ? t("paradas", { count: 1 }) : t("paradasPlural", { count: poisEnRuta.length })}<span className="text-on-surface-variant font-normal ml-1">/12</span></span>
                    </div>
                    {poisEnRuta.length > 0 && <button onClick={limpiarRuta} className="text-xs text-on-surface-variant hover:text-tertiary font-bold">{t("limpiar")}</button>}
                  </div>
                  <TransportSelector value={transportMode} onChange={setTransportMode} enableMetro={metroEnabled} />
                  <div className="flex gap-2">
                    <button onClick={() => calcularRuta()} disabled={poisEnRuta.length < 1 || activeLoading}
                      className={`flex-1 py-3 rounded-xl font-headline font-black text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${isAccessibleMode ? "bg-[#fed000] text-[#003e6f]" : "bg-secondary text-on-secondary"}`}>
                      {activeLoading ? (isAccessibleMode ? t("analyzingAccessible") : t("calculando")) : (isAccessibleMode ? t("accessibleRouteCta") : isMetroMode ? t("metroRouteCta") : t("calcularRuta"))}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant/10 py-3 z-50">
        <div className="flex justify-around items-center px-4">
          <Link href="/" className="flex flex-col items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined">explore</span><span className="text-[10px] font-bold uppercase tracking-tighter">{tn("explorar")}</span></Link>
          <button onClick={() => setMobileSheetOpen((v) => !v)} className="flex flex-col items-center gap-1 text-secondary"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span><span className="text-[10px] font-bold uppercase tracking-tighter">{tn("mapa")}</span></button>
          <button onClick={() => setPartyModalOpen(true)} className="flex flex-col items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined">celebration</span><span className="text-[10px] font-bold uppercase tracking-tighter">Party</span></button>
          <button onClick={() => { setTransportMode(isAccessibleMode ? "walking" : "accessible"); setMobileSheetOpen(true); }} className={`flex flex-col items-center gap-1 transition-colors ${isAccessibleMode ? "text-[#003e6f]" : "text-on-surface-variant"}`}>
            <span className="material-symbols-outlined" style={isAccessibleMode ? { fontVariationSettings: "'FILL' 1" } : undefined}>accessible</span><span className="text-[10px] font-bold uppercase tracking-tighter">Accesible</span>
          </button>
          <Link href="/perfil" className="flex flex-col items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined">account_circle</span><span className="text-[10px] font-bold uppercase tracking-tighter">{tn("perfil")}</span></Link>
        </div>
      </div>
    </div>
  );
}
