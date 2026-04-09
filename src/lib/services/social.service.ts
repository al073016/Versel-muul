/**
 * Social Service — SUPABASE REAL version
 *
 * Requires migration 002_social_and_gamification.sql to be executed first.
 *
 * Fallback: if Supabase returns empty feed (table just created, no rows yet),
 * it injects the static seed posts so the UI never looks empty.
 */
import { DUMMY_POSTS, DUMMY_SOCIAL_USERS, type SocialPost } from "../social-dummy";

const LOCAL_POSTS_KEY = "muul_local_posts";

const SUPABASE_POST_TO_SOCIAL_POST = (row: any): SocialPost => ({
  id: row.id,
  user_id: row.usuario_id,
  content: row.contenido,
  image_urls: row.imagen_urls ?? [],
  likes: row.likes_count ?? 0,
  dislikes: 0,
  comments: 0,
  created_at: new Date(row.created_at).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  }),
  is_friend: false,
  user: {
    id: row.usuario_id,
    username: row.autor_username ? `@${row.autor_username}` : "@usuario",
    full_name: row.autor_nombre ?? "Usuario",
    avatar_url: row.autor_avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(row.autor_nombre ?? "U")}&background=003e6f&color=fff&bold=true&size=200`,
    points: row.autor_puntos ?? 0,
    level: row.autor_nivel ?? "Explorador Novato",
  },
});

export const SocialService = {
  async getFeedPosts(): Promise<SocialPost[]> {
    let posts: SocialPost[] = [];
    
    const supabaseTimeout = new Promise<SocialPost[]>((_, reject) => 
      setTimeout(() => reject(new Error("Supabase Timeout")), 3000)
    );

    try {
      const fetchFromSupabase = async (): Promise<SocialPost[]> => {
        const { createClient } = await import("../supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_feed_publicaciones", { p_limit: 50 });
        if (!error && data) return data.map(SUPABASE_POST_TO_SOCIAL_POST);
        return [];
      };

      posts = await Promise.race([fetchFromSupabase(), supabaseTimeout]);
    } catch (e) {
      console.warn("[SocialService] Supabase unavailable or timeout, using local/dummy only", e);
    }

    // Merge with local posts from localStorage
    const localPostsRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_POSTS_KEY) : null;
    if (localPostsRaw) {
      try {
        const localPosts = JSON.parse(localPostsRaw);
        posts = [...localPosts, ...posts];
      } catch (e) {
        console.error("[SocialService] Error parsing local posts", e);
      }
    }

    // Final merge: DUMMY_POSTS + Supabase + Local
    // We unique them by ID to avoid duplicates
    const allPosts = [...posts];
    const dummyIds = new Set(allPosts.map(p => p.id));
    
    for (const d of DUMMY_POSTS) {
      if (!dummyIds.has(d.id)) {
        allPosts.push(d);
      }
    }

    return allPosts.sort((a, b) => {
      // Keep local posts at the top, then by date
      if (a.id.startsWith('local_') && !b.id.startsWith('local_')) return -1;
      if (!a.id.startsWith('local_') && b.id.startsWith('local_')) return 1;
      return 0; // Or refine by date if needed
    });
  },

  async createPost(userId: string, content: string, imageUrls: string[] = []): Promise<SocialPost> {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 6000));
      const createAction = async () => {
        const { createClient } = await import("../supabase/client");
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("publicaciones")
          .insert({ usuario_id: authUser.id, contenido: content, imagen_urls: imageUrls })
          .select()
          .single();

        if (error) throw error;

        const { data: feedRow } = await supabase
          .rpc("get_feed_publicaciones", { p_limit: 1 })
          .eq("id", data.id)
          .single();

        return SUPABASE_POST_TO_SOCIAL_POST(feedRow ?? data);
      };

      return (await Promise.race([createAction(), timeoutPromise])) as SocialPost;
    } catch (e: any) {
      console.error("[SocialService] Error en createPost (using resilience fallback):", e);
      
      // PERSISTENCE FALLBACK: Save to LocalStorage if Supabase fails/denied
      const localPost: SocialPost = {
        id: `local_${Date.now()}`,
        user_id: userId,
        content,
        image_urls: imageUrls,
        likes: 0,
        dislikes: 0,
        comments: 0,
        created_at: "Demo Mode (Local)",
        is_friend: true,
        user: {
          id: userId,
          username: "@yo",
          full_name: "Tú",
          avatar_url: `https://ui-avatars.com/api/?name=Yo&background=003e6f&color=fff&bold=true&size=200`,
          points: 0,
          level: "Modo Local",
        },
      };

      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem(LOCAL_POSTS_KEY);
        const posts = existing ? JSON.parse(existing) : [];
        localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify([localPost, ...posts]));
      }
      
      return localPost;
    }
  },

  async toggleLike(postId: string): Promise<boolean> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      const { data } = await supabase.rpc("toggle_like", { p_publicacion_id: postId });
      return !!data;
    } catch {
      return false;
    }
  },

  async uploadImage(file: File): Promise<string | null> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      
      const fileExt = file.name.split('.').pop() || 'png';
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anon';
      const fileName = `${userId}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = fileName;

      console.log("[SocialService] Subiendo imagen:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('publicaciones')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("[SocialService] Error en storage.upload:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('publicaciones')
        .getPublicUrl(filePath);

      console.log("[SocialService] Imagen subida exitosamente:", data.publicUrl);
      return data.publicUrl;
    } catch (e) {
      console.error("[SocialService] Error detallado en uploadImage:", e);
      return null;
    }
  }
};
