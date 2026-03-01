import { useMemo } from "react";

interface BusinessPlanInput {
  subscription_plan: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
}

export const useBusinessPlan = (business: BusinessPlanInput | null | undefined) => {
  return useMemo(() => {
    if (!business) return {
      isPro: false, isStart: false, isFree: true,
      isOnTrial: false, trialDaysLeft: 0,
    };

    const now = new Date();
    const trialEnd = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
    const isOnTrial = !!trialEnd && trialEnd > now;
    const trialDaysLeft = isOnTrial
      ? Math.ceil((trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const hasActiveSubscription = business.subscription_status === "active";

    const isPro = isOnTrial || 
      (hasActiveSubscription && (
        business.subscription_plan === "pro" ||
        business.subscription_plan === "1_year" ||
        business.subscription_plan === "1_month"
      ));

    const isStart = !isOnTrial && hasActiveSubscription && 
      business.subscription_plan === "start";

    const isFree = !isPro && !isStart;

    return { isPro, isStart, isFree, isOnTrial, trialDaysLeft };
  }, [business]);
};
