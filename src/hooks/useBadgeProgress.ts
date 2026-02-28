import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BadgeWithProgress {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon_url: string | null;
  display_order: number | null;
  is_public: boolean | null;
  criteria: any;
  current_value: number;
  target_value: number;
  earned_at: string | null;
  unlocked: boolean;
}

export const useBadgeProgress = (businessId: string | undefined) => {
  const qc = useQueryClient();

  // Trigger RPC to recompute progress
  const recompute = useMutation({
    mutationFn: async () => {
      if (!businessId) return;
      const { error } = await supabase.rpc("compute_badge_progress", {
        p_business_id: businessId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["badge-progress", businessId] });
    },
  });

  const query = useQuery({
    queryKey: ["badge-progress", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return [];

      // Recompute first
      await supabase.rpc("compute_badge_progress", {
        p_business_id: businessId,
      });

      // Get all active badges
      const { data: badges, error: bErr } = await supabase
        .from("business_badges")
        .select("id, name, slug, description, color, icon_url, display_order, is_public, criteria")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (bErr) throw bErr;

      // Get progress
      const { data: progress, error: pErr } = await supabase
        .from("business_badge_progress" as any)
        .select("badge_id, current_value, target_value")
        .eq("business_id", businessId);
      if (pErr) throw pErr;

      // Get earned badges
      const { data: earned, error: eErr } = await supabase
        .from("business_earned_badges")
        .select("badge_id, earned_at")
        .eq("business_id", businessId);
      if (eErr) throw eErr;

      const progressMap = new Map((progress as any[] || []).map((p: any) => [p.badge_id, p]));
      const earnedMap = new Map((earned || []).map((e) => [e.badge_id, e.earned_at]));

      const result: BadgeWithProgress[] = (badges || []).map((b) => {
        const p = progressMap.get(b.id);
        const earnedAt = earnedMap.get(b.id) || null;
        const target = p?.target_value || (b.criteria as any)?.target || 0;
        const current = p?.current_value || 0;
        return {
          ...b,
          current_value: current,
          target_value: target,
          earned_at: earnedAt,
          unlocked: !!earnedAt || (target > 0 && current >= target),
        };
      });

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

  return { ...query, recompute };
};
