import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useConsumerPlan = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consumer-plan", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("consumer_plan_id, consumer_plan_expires_at, consumer_plans(*)")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return {
        plan: data?.consumer_plans || null,
        expiresAt: data?.consumer_plan_expires_at || null,
      };
    },
    enabled: !!user?.id,
  });
};

export const useAllConsumerPlans = () => {
  return useQuery({
    queryKey: ["consumer-plans-all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("consumer_plans")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });
};
