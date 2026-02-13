import { useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { useBusinessIntelligence } from "@/hooks/useBusinessIntelligence";
import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import DateRangeFilter from "@/components/intelligence/DateRangeFilter";
import BusinessPerformanceCard from "@/components/intelligence/BusinessPerformanceCard";
import UpgradeAnalyticsCard from "@/components/intelligence/UpgradeAnalyticsCard";

interface BusinessInsightsContentProps {
  businessId: string;
  planId: string | null;
}

const BusinessInsightsContent = ({ businessId, planId }: BusinessInsightsContentProps) => {
  const [days, setDays] = useState(30);
  const { data: planRule, isLoading: ruleLoading } = usePlanRuleByPlanId(planId);

  const hasAccess = !!(planRule as any)?.allow_analytics_pro;

  const { data, isLoading, error } = useBusinessIntelligence(
    hasAccess ? businessId : null,
    days
  );

  if (ruleLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Insights</h1>
        </div>
        <UpgradeAnalyticsCard />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Erro ao carregar insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Insights</h1>
        </div>
        <DateRangeFilter days={days} onChange={setDays} />
      </div>
      <BusinessPerformanceCard data={data} />
    </div>
  );
};

export default BusinessInsightsContent;
