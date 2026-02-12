import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanRule {
  id: string;
  plan_id: string;
  max_gallery_images: number | null;
  max_modules: number | null;
  allow_video: boolean;
  allow_category_highlight: boolean;
  allow_super_highlight: boolean;
  allow_premium_block: boolean;
  created_at: string;
  updated_at: string;
}

export const usePlanRules = () => {
  return useQuery({
    queryKey: ["plan-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_rules" as any)
        .select("*");
      if (error) throw error;
      return data as unknown as PlanRule[];
    },
  });
};

export const usePlanRuleByPlanId = (planId: string | null | undefined) => {
  return useQuery({
    queryKey: ["plan-rules", planId],
    queryFn: async () => {
      if (!planId) return null;
      const { data, error } = await supabase
        .from("plan_rules" as any)
        .select("*")
        .eq("plan_id", planId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PlanRule | null;
    },
    enabled: !!planId,
  });
};

export const useUpsertPlanRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<PlanRule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("plan_rules" as any)
        .upsert(rule as any, { onConflict: "plan_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-rules"] }),
  });
};
