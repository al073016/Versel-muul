/**
 * Services barrel export.
 * Import services from here: `import { SocialService, FriendsService, BusinessService, POIService } from "@/lib/services"`
 *
 * MIGRATION NOTE:
 * All services follow the LOCAL-FIRST ADAPTER pattern:
 * - Today: localStorage + seed data
 * - Tomorrow: swap internals for supabase calls, UI stays identical
 */

export { SocialService } from "./social.service";
export { FriendsService } from "./friends.service";
export { BusinessService } from "./business.service";
export { POIService } from "./poi.service";
export { GamificationService } from "./gamification.service";
