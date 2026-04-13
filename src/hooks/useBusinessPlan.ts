import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BusinessPlanInput {
  plan_id?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  is_premium?: boolean;
}

export type BusinessTier = "free" | "start" | "pro";

/**
 * Fetches ALL commercial plans once and caches for 10 min.
 * Returns a Map<plan_id, tier>.
 */
export const useCommercialPlanTiers = () => {
  return useQuery({
    queryKey: ["commercial-plan-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_plans")
        .select("id, tier");
      if (error) throw error;
      const map = new Map<string, string>();
      for (const p of data ?? []) {
        map.set(p.id, p.tier ?? "free");
      }
      return map;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Resolves the active tier for a business.
 *
 * Priority:
 * 1. Active trial → PRO
 * 2. Active subscription + plan_id → look up tier from commercial_plans
 * 3. Active subscription + is_premium fallback → PRO
 * 4. Otherwise → FREE
 */
export const useBusinessPlan = (business: BusinessPlanInput | null | undefined) => {
  const { data: tierMap } = useCommercialPlanTiers();

  return useMemo(() => {
    const fallback = {
      isPro: false, isStart: false, isFree: true,
      isOnTrial: false, trialDaysLeft: 0,
      tier: "free" as BusinessTier,
    };

    if (!business) return fallback;

    const now = new Date();
    const trialEnd = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
    const isOnTrial = !!trialEnd && trialEnd > now;
    const trialDaysLeft = isOnTrial
      ? Math.ceil((trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Trial always grants PRO
    if (isOnTrial) {
      return { isPro: true, isStart: false, isFree: false, isOnTrial, trialDaysLeft, tier: "pro" as BusinessTier };
    }

    const hasActiveSubscription = business.subscription_status === "active";

    if (!hasActiveSubscription) {
      return { ...fallback, isOnTrial, trialDaysLeft };
    }

    // Resolve tier from commercial_plans via plan_id
    let resolvedTier: BusinessTier = "free";

    if (business.plan_id && tierMap) {
      const planTier = tierMap.get(business.plan_id);
      if (planTier === "pro") resolvedTier = "pro";
      else if (planTier === "start") resolvedTier = "start";
      else if (planTier === "addon") resolvedTier = "free"; // addon is not a base tier
      // else stays free
    } else if (business.is_premium === true) {
      // Fallback for cases where tierMap isn't loaded yet or plan_id missing
      resolvedTier = "pro";
    }

    const isPro = resolvedTier === "pro";
    const isStart = resolvedTier === "start";
    const isFree = !isPro && !isStart;

    return { isPro, isStart, isFree, isOnTrial, trialDaysLeft, tier: resolvedTier };
  }, [business, tierMap]);
};
