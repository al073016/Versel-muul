import { CURATED_PLACE_IMAGES } from "@/lib/dummy-data";

/**
 * MUUL — Editorial Photo Engine
 * Genera imágenes de alta calidad (Unsplash) basadas en categorías y nombres
 * para mantener la estética "Premium Light" de la app.
 */

export const CATEGORY_QUERIES: Record<string, string> = {
  comida: "mexican gourmet food CDMX cuisine",
  tienda: "mexico city boutique shop luxury",
  cultural: "mexico city bellas artes museum architecture",
  deportes: "modern mexico city stadium",
  hospedaje: "mexico city hotel luxury room",
  eventos: "mexico city concert venue stage lights",
  servicios: "mexico city business services coworking",
  servicio: "mexico city professional service",
  default: "mexico city luxury travel destination"
};

// Fotos "Curadas" para que al menos las de la demo sean perfectas
export const CURATED_PHOTOS: Record<string, string> = {
  ...CURATED_PLACE_IMAGES,
};

/**
 * Obtiene una imagen premium para un lugar.
 * Prioridad:
 * 1. Fotos curadas para la demo
 * 2. URL personalizada (foto_url en BD)
 * 3. Imagen de Supabase Storage
 * 4. Fallback a Unsplash
 * 
 * @param nombre Nombre del lugar
 * @param categoria Categoría del lugar
 * @param customUrl URL personalizada (desde BD)
 * @returns {string} URL de la imagen
 */
export function getPremiumPhoto(
  nombre: string,
  categoria?: string,
  customUrl?: string | null
): string {
  // 1. Prioridad: URL personalizada desde BD
  if (customUrl) {
    return customUrl;
  }

  // 2. Fotos curadas para la demo
  if (CURATED_PHOTOS[nombre]) {
    return CURATED_PHOTOS[nombre];
  }

  // 3. Generación dinámica (Unsplash Source-like approach)
  // Usamos una URL de búsqueda que resuelve a una imagen de alta calidad
  const query = `${nombre} ${CATEGORY_QUERIES[categoria || "default"]} city architecture`;
  const sanitizedQuery = encodeURIComponent(query.toLowerCase());
  
  // Como no tenemos API Key de Unsplash configurada aún en el cliente,
  // usamos el servicio de Source.unsplash (que sigue funcionando para queries simples)
  return `https://source.unsplash.com/featured/800x600?${sanitizedQuery}`;
}

/**
 * Fallback para cuando falla la carga de una imagen específica
 */
export const PLACEHOLDER_BANNER = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop";
