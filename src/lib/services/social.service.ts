/**
 * Social Service — SUPABASE REAL version
 *
 * Requires migration 002_social_and_gamification.sql to be executed first.
 *
 * Fallback: if Supabase returns empty feed (table just created, no rows yet),
 * it injects the static seed posts so the UI never looks empty.
 */
import { DUMMY_POSTS, DUMMY_SOCIAL_USERS, type SocialPost } from "../social-dummy";

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
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_feed_publicaciones", { p_limit: 50 });

      if (!error && data && data.length > 0) {
        return data.map(SUPABASE_POST_TO_SOCIAL_POST);
      }
    } catch (e) {
      console.warn("[SocialService] Supabase unavailable, using local seed", e);
    }

    // Fallback: seed data so feed never looks empty
    return [...DUMMY_POSTS];
  },

  async createPost(userId: string, content: string, imageUrls: string[] = []): Promise<SocialPost> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("publicaciones")
        .insert({ usuario_id: user.id, contenido: content, imagen_urls: imageUrls })
        .select()
        .single();

      if (error) throw error;

      // Re-fetch with joined author data for the newly created post
      const { data: feedRow } = await supabase
        .rpc("get_feed_publicaciones", { p_limit: 1 })
        .eq("id", data.id)
        .single();

      return SUPABASE_POST_TO_SOCIAL_POST(feedRow ?? data);
    } catch (e) {
      console.warn("[SocialService] createPost fallback to local", e);
    }

    // Local fallback
    const { data: { user: authUser } } = await (await import("../supabase/client")).createClient().auth.getUser();
    
    const user = {
      id: userId,
      username: authUser?.user_metadata?.username ? `@${authUser.user_metadata.username}` : (authUser?.email?.split('@')[0] || "@usuario"),
      full_name: authUser?.user_metadata?.nombre_completo || authUser?.email || "Tú",
      avatar_url: authUser?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser?.email || "U")}&background=003e6f&color=fff&bold=true&size=200`,
      points: 0,
      level: "Explorador",
    };

    return {
      id: `post_local_${Date.now()}`,
      user_id: userId,
      content,
      image_urls: imageUrls,
      likes: 0,
      dislikes: 0,
      comments: 0,
      created_at: "Justo ahora",
      is_friend: true,
      user,
    };
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
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('publicaciones')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('publicaciones')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (e) {
      console.error("[SocialService] Error uploading image:", e);
      return null;
    }
  }
};
