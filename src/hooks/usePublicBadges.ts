import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicBadge {
  badge_name: string;
  badge_slug: string;
  badge_icon_url: string | null;
  badge_color: string | null;
}

// Priority order for display (most valuable first)
const BADGE_PRIORITY: Record<string, number> = {
  "super-avaliado": 0,
  "top-rated": 1,
  "verified": 2,
  "top-resposta": 3,
  "muito-solicitado": 4,
  "em-chamas": 5,
  "lider-local": 6,
  "quick-response": 7,
  "local-favorite": 8,
  "primeiro-passo": 9,
  "primeiro-olhar": 10,
  "primeira-fasica": 11,
  "founding-member": 12,
};

const BADGE_ICONS: Record<string, string> = {
  "super-avaliado": "⭐",
  "top-rated": "⭐",
  "verified": "✓",
  "top-resposta": "⚡",
  "muito-solicitado": "🔥",
  "em-chamas": "🔥",
  "lider-local": "🏆",
  "quick-response": "⚡",
  "local-favorite": "❤️",
  "primeiro-passo": "🎯",
  "primeiro-olhar": "👁",
  "primeira-fasica": "⚡",
  "founding-member": "🏅",
};

const SHORT_LABELS: Record<string, string> = {
  "super-avaliado": "Super Avaliado",
  "top-rated": "Top Avaliado",
  "verified": "Verificado",
  "top-resposta": "Top Resposta",
  "muito-solicitado": "Muito Solicitado",
  "em-chamas": "Em Chamas",
  "lider-local": "Líder Local",
  "quick-response": "Resposta Rápida",
  "local-favorite": "Favorito",
  "primeiro-passo": "Perfil Completo",
  "primeiro-olhar": "Primeiro Olhar",
  "primeira-fasica": "Primeira Faísca",
  "founding-member": "Membro Fundador",
};

export const getBadgeIcon = (slug: string) => BADGE_ICONS[slug] || "🏅";
export const getBadgeLabel = (slug: string, name?: string) => SHORT_LABELS[slug] || name || slug;
export const getBadgePriority = (slug: string) => BADGE_PRIORITY[slug] ?? 99;

/**
 * Fetch public badges for a single business (used on BusinessPage)
 */
export const useBusinessPublicBadges = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["public-badges", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase.rpc("get_business_public_badges" as any, {
        p_business_id: businessId,
      });
      if (error) throw error;
      return (data || []) as PublicBadge[];
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

/**
 * Batch fetch public badges for multiple businesses (for listings)
 */
export const useBatchPublicBadges = (businessIds: string[]) => {
  return useQuery({
    queryKey: ["batch-public-badges", businessIds.sort().join(",")],
    queryFn: async () => {
      if (businessIds.length === 0) return new Map<string, PublicBadge[]>();

      // Use badge_progress + badges join to get all at once
      const { data, error } = await (supabase as any)
        .from("business_badge_progress")
        .select(`
          business_id,
          current_value,
          target_value,
          business_badges!inner (
            name,
            slug,
            icon_url,
            color,
            is_public,
            is_active
          )
        `)
        .in("business_id", businessIds)
        .eq("business_badges.is_public", true)
        .eq("business_badges.is_active", true);

      if (error) throw error;

      const map = new Map<string, PublicBadge[]>();
      for (const row of (data || []) as any[]) {
        if (row.current_value >= row.target_value && row.target_value > 0) {
          const bid = row.business_id;
          if (!map.has(bid)) map.set(bid, []);
          map.get(bid)!.push({
            badge_name: row.business_badges.name,
            badge_slug: row.business_badges.slug,
            badge_icon_url: row.business_badges.icon_url,
            badge_color: row.business_badges.color,
          });
        }
      }

      // Sort each list by priority
      for (const [, badges] of map) {
        badges.sort((a, b) => getBadgePriority(a.badge_slug) - getBadgePriority(b.badge_slug));
      }

      return map;
    },
    enabled: businessIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
