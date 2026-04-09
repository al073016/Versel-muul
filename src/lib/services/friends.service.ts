/**
 * Friends Service — SUPABASE REAL version
 *
 * Requires migration 002_social_and_gamification.sql (tabla amistades).
 *
 * Fallback: localStorage con seed data estático si Supabase no responde.
 */

type Friend = {
  id: string;
  name: string;
  username: string;
  status: string;
  online: boolean;
  avatar: string;
  lat?: number;
  lng?: number;
};

type SearchResult = { id: string; name: string; username: string; avatar: string };

// ─── Static seed for decorative "relleno" (used as fallback only) ───────────
const SEED_FRIENDS: Friend[] = [
  { id: "f1", name: "Carlos Rivera",   username: "@carlos_explorador", status: "Explorando Roma Norte",      online: true,  avatar: "https://i.pravatar.cc/150?u=carlos", lat: 19.4174, lng: -99.1609 },
  { id: "f2", name: "Ana Martínez",    username: "@viajera66",          status: "Desconectada hace 2 horas", online: false, avatar: "https://i.pravatar.cc/150?u=ana"    },
  { id: "f3", name: "Diego Sánchez",   username: "@foodie_mx",          status: "En el Mercado de Medellín", online: true,  avatar: "https://i.pravatar.cc/150?u=diego", lat: 19.4040, lng: -99.1670 },
  { id: "f4", name: "Sofía López",     username: "@sofia_cdmx",         status: "Desconectada hace 1 día",   online: false, avatar: "https://i.pravatar.cc/150?u=sofia"  },
];

const FRIENDS_LS_KEY = "muul_friends_v2";

const loadLocalFriends = (): Friend[] => {
  if (typeof window === "undefined") return SEED_FRIENDS;
  try {
    const raw = localStorage.getItem(FRIENDS_LS_KEY);
    if (raw) return JSON.parse(raw);
    // First load: seed
    localStorage.setItem(FRIENDS_LS_KEY, JSON.stringify(SEED_FRIENDS));
    return SEED_FRIENDS;
  } catch { return SEED_FRIENDS; }
};

const saveLocalFriends = (friends: Friend[]) => {
  if (typeof window !== "undefined")
    localStorage.setItem(FRIENDS_LS_KEY, JSON.stringify(friends));
};

// ─── Service ─────────────────────────────────────────────────────────────────
export const FriendsService = {
  async getAmigos(): Promise<Friend[]> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("get_mis_amigos");
      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.amistad_id,
          name: row.nombre_completo ?? "Usuario",
          username: row.username ? `@${row.username}` : "@usuario",
          status: "Amigo en Muul",
          online: false,
          avatar: row.foto_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nombre_completo ?? "U")}&background=003e6f&color=fff&bold=true&size=200`,
        }));
      }
    } catch (e) {
      console.warn("[FriendsService] Using local fallback", e);
    }

    return loadLocalFriends();
  },

  async eliminarAmigo(id: string): Promise<boolean> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      const { error } = await supabase.from("amistades").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      // Fallback: local
      saveLocalFriends(loadLocalFriends().filter(f => f.id !== id));
      return true;
    }
  },

  async buscarUsuarios(query: string): Promise<SearchResult[]> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      // Uses the existing buscar_usuarios RPC from schema.sql
      const { data, error } = await supabase.rpc("buscar_usuarios", { query });
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.nombre_completo,
          username: u.username ? `@${u.username}` : "@usuario",
          avatar: u.foto_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre_completo ?? "U")}&background=003e6f&color=fff&bold=true&size=200`,
        }));
      }
    } catch (e) {
      console.warn("[FriendsService] Search fallback", e);
    }

    // Local search fallback
    const SEARCHABLE: SearchResult[] = [
      { id: "su1", name: "Sofía Navarro",    username: "@sofia_cdmx",   avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" },
      { id: "su2", name: "Valentina Orozco", username: "@vale_fit",     avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200" },
      { id: "su3", name: "Marco Villanueva", username: "@marco_photo",  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
      { id: "su4", name: "Pedro Castañeda",  username: "@el_chef_pedro", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" },
    ];
    const q = query.toLowerCase();
    return SEARCHABLE.filter(u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  },

  async solicitarAmistad(userId: string, userName: string, userAvatar: string): Promise<Friend> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("amistades").insert({
        id_solicitante: user.id,
        id_receptor: userId,
        estado: "aceptada",
      });
      if (error && !error.message.includes("unique")) throw error; // ignore duplicate
    } catch (e) {
      console.warn("[FriendsService] solicitarAmistad fallback", e);
    }

    // Always return the friend object for optimistic UI update
    const newFriend: Friend = {
      id: `friend_${Date.now()}`,
      name: userName,
      username: `@${userName.split(" ")[0].toLowerCase()}`,
      status: "Recién agregado",
      online: false,
      avatar: userAvatar,
    };

    // Also persist locally as backup
    const friends = loadLocalFriends();
    friends.unshift(newFriend);
    saveLocalFriends(friends);

    return newFriend;
  },
};
