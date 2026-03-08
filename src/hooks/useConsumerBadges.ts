import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConsumerBadge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string | null;
  category: string;
  criteria_type: string;
  criteria_value: number;
  display_order: number | null;
}

export interface ConsumerBadgeWithProgress extends ConsumerBadge {
  current_value: number;
  target_value: number;
  earned_at: string | null;
  unlocked: boolean;
}

/**
 * Fetch all consumer badge definitions
 */
export const useConsumerBadges = () => {
  return useQuery({
    queryKey: ["consumer-badges"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("consumer_badges")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as ConsumerBadge[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Fetch badge progress for the current user, triggering recompute first
 */
export const useConsumerBadgeProgress = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["consumer-badge-progress", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];

      // Recompute progress
      await supabase.rpc("compute_consumer_badge_progress", {
        p_user_id: profileId,
      });

      // Fetch all badges
      const { data: badges, error: bErr } = await (supabase as any)
        .from("consumer_badges")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (bErr) throw bErr;

      // Fetch progress
      const { data: progress, error: pErr } = await (supabase as any)
        .from("consumer_badge_progress")
        .select("badge_id, current_value, target_value")
        .eq("user_id", profileId);
      if (pErr) throw pErr;

      // Fetch earned
      const { data: earned, error: eErr } = await (supabase as any)
        .from("consumer_earned_badges")
        .select("badge_id, earned_at")
        .eq("user_id", profileId);
      if (eErr) throw eErr;

      const progressMap = new Map(
        ((progress as any[]) || []).map((p: any) => [p.badge_id, p])
      );
      const earnedMap = new Map(
        ((earned as any[]) || []).map((e: any) => [e.badge_id, e.earned_at])
      );

      const result: ConsumerBadgeWithProgress[] = ((badges as any[]) || []).map(
        (b: any) => {
          const p = progressMap.get(b.id);
          const earnedAt = earnedMap.get(b.id) || null;
          const target = p?.target_value || b.criteria_value;
          const current = p?.current_value || 0;
          return {
            ...b,
            current_value: current,
            target_value: target,
            earned_at: earnedAt,
            unlocked: !!earnedAt || (target > 0 && current >= target),
          };
        }
      );

      // Sort: unlocked first, then by display_order
      result.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });

      return result;
    },
    staleTime: 60000,
  });
};

/**
 * Get the next badge closest to being unlocked
 */
export const useConsumerNextBadge = (profileId: string | undefined) => {
  const { data: badges = [] } = useConsumerBadgeProgress(profileId);

  const inProgress = badges.filter((b) => !b.unlocked && b.target_value > 0);
  if (inProgress.length === 0) return null;

  // Sort by closest to completion
  return inProgress.sort(
    (a, b) =>
      b.current_value / b.target_value - a.current_value / a.target_value
  )[0];
};
