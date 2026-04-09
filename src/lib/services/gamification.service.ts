/**
 * Gamification Service — SUPABASE REAL version
 * 
 * Handles user points, levels, and badges.
 * 
 * Logic:
 * 1. Points are stored in the 'perfiles' table.
 * 2. Levels are auto-synced by the SQL trigger 'sync_nivel'.
 * 3. Badges are currently static based on rules, but could be stored in 'perfil_insignias'.
 */

export type Badge = {
  emoji: string;
  label: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  progress?: number;
  total?: number;
};

export const GamificationService = {
  /**
   * Calculates dynamic badges based on user performance.
   * Currently uses some heuristics, but prepared for real data.
   */
  async getBadges(userId: string): Promise<Badge[]> {
    try {
      const { createClient } = await import("../supabase/client");
      const supabase = createClient();
      
      // Fetch user stats from different tables to determine badge progress
      const [
        { count: routes },
        { count: posts },
        { count: photos }
      ] = await Promise.all([
        supabase.from('rutas_guardadas').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('publicaciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        // Simplified: count posts with images
        supabase.from('publicaciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId).neq('imagen_urls', '{}')
      ]);

      const badges: Badge[] = [
        { 
          emoji: "🌮", 
          label: "Maestro Taquero", 
          description: "Visita 10 taquerías verificadas.",
          tier: (routes ?? 0) >= 10 ? 'gold' : (routes ?? 0) >= 5 ? 'silver' : 'bronze',
          progress: Math.min(routes ?? 0, 10),
          total: 10
        },
        { 
          emoji: "📸", 
          label: "Influencer Local", 
          description: "Comparte 5 fotos de lugares.",
          tier: (photos ?? 0) >= 5 ? 'gold' : (photos ?? 0) >= 2 ? 'silver' : 'bronze',
          progress: Math.min(photos ?? 0, 5),
          total: 5
        },
        { 
          emoji: "🗣️", 
          label: "Voz de la Comunidad", 
          description: "Haz 10 publicaciones en el feed.",
          tier: (posts ?? 0) >= 10 ? 'gold' : (posts ?? 0) >= 3 ? 'silver' : 'bronze',
          progress: Math.min(posts ?? 0, 10),
          total: 10
        }
      ];

      return badges;
    } catch {
      // Fallback
      return [
        { emoji: "🥾", label: "Pimeros Pasos", description: "Tu primera aventura.", tier: 'bronze', progress: 1, total: 1 },
      ];
    }
  }
};
