/* =============================================
   MUUL — Database Types
   Matches the Supabase schema
   ============================================= */

export type TipoCuenta = "turista" | "negocio";
export type CategoriaNegocio = "comida" | "tienda" | "servicios" | "cultural" | "deportes";
export type CategoriaPOI = "comida" | "cultural" | "tienda" | "deportes" | "servicio";
export type PrecioRango = "$" | "$$" | "$$$" | "$$$$";
export type CategoriaInsignia = "cultural" | "comida" | "tiendas" | "especial";
export type NivelInsignia = "bronce" | "plata" | "oro" | "platino";

export interface Perfil {
  id: string;
  tipo_cuenta: TipoCuenta;
  username: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string | null;
  nombre_completo?: string;
  nombre_original?: string;
  idioma?: string;
  language?: string;
  avatar_url?: string | null;
  foto_url?: string | null;
  banner_url?: string | null;
  ciudad?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Negocio {
  id: string;
  propietario_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaNegocio;
  rfc: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  especialidades: string[];
  verificado: boolean;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
}

export interface POI {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaPOI;
  latitud: number;
  longitud: number;
  direccion: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  precio_rango: PrecioRango | null;
  emoji: string | null;
  verificado: boolean;
  negocio_id: string | null;
  created_at: string;
}

export interface Resena {
  id: string;
  usuario_id: string;
  poi_id: string;
  calificacion: number;
  texto: string | null;
  likes: number;
  created_at: string;
}

export interface Visita {
  id: string;
  usuario_id: string;
  poi_id: string;
  verificada: boolean;
  created_at: string;
}

export interface Insignia {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaInsignia;
  nivel: NivelInsignia;
  visitas_requeridas: number;
  emoji: string | null;
  created_at: string;
}

export interface UsuarioInsignia {
  id: string;
  usuario_id: string;
  insignia_id: string;
  desbloqueada_en: string;
}
export interface RutaGuardada {
  id: string;
  usuario_id: string;
  nombre: string;
  pois_ids: string[];
  pois_data: Record<string, unknown>[];
  distancia_texto: string | null;
  duracion_texto: string | null;
  created_at: string;
}