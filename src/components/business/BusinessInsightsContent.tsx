import { useState } from "react";
import { Loader2, TrendingUp, Lock } from "lucide-react";
import { useBusinessIntelligence } from "@/hooks/useBusinessIntelligence";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import DateRangeFilter from "@/components/intelligence/DateRangeFilter";
import BusinessPerformanceCard from "@/components/intelligence/BusinessPerformanceCard";
import BusinessBenchmarkCard from "@/components/intelligence/BusinessBenchmarkCard";
import UpgradeAnalyticsCard from "@/components/intelligence/UpgradeAnalyticsCard";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BusinessInsightsContentProps {
  businessId: string;
  planId: string | null;
  claimStatus?: string;
}

const BusinessInsightsContent = ({ businessId, planId, claimStatus = "verified" }: BusinessInsightsContentProps) => {
  const [days, setDays] = useState(30);
  const { data: planRule, isLoading: ruleLoading } = usePlanRuleByPlanId(planId);
  const { data: analytics } = useBusinessAnalytics(claimStatus === "verified" ? businessId : null, days);

  const isVerified = claimStatus === "verified";
  const hasProAccess = !!(planRule as any)?.allow_analytics_pro;
  const hasBasicAccess = (planRule as any)?.allow_analytics_basic !== false;

  const { data, isLoading, error } = useBusinessIntelligence(
    isVerified && hasProAccess ? businessId : null,
    days
  );

  // Block completely if not verified
  if (!isVerified) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Insights</h1>
        </div>
        <Alert className="border-muted bg-muted/50">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Os insights estarão disponíveis após a validação do seu claim. Aguarde aprovação.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (ruleLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verified + Free: show basic analytics + upsell
  if (!hasProAccess) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Insights</h1>
        </div>

        {hasBasicAccess && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground">Visualizações</p>
              <p className="text-2xl font-bold">{analytics?.views ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Últimos {days} dias</p>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground">Contactos</p>
              <p className="text-2xl font-bold">{analytics?.totalContacts ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">📞{analytics?.breakdown.phone ?? 0} · 💬{analytics?.breakdown.whatsapp ?? 0}</p>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground">Cliques Website</p>
              <p className="text-2xl font-bold">{analytics?.breakdown.website ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">✉️ Email: {analytics?.breakdown.email ?? 0}</p>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 flex items-center justify-center rounded-xl">
            <div className="text-center space-y-2 p-6">
              <Lock className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold text-lg">Desbloqueie o Analytics Pro</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Aceda a analytics avançados, benchmarking com a concorrência e muito mais com um plano pago.
              </p>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none">
            <UpgradeAnalyticsCard />
          </div>
        </div>
      </div>
    );
  }

  // Verified + Paid: full access
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Insights</h1>
        </div>
        <DateRangeFilter days={days} onChange={setDays} />
      </div>

      {/* Performance do negócio */}
      <BusinessPerformanceCard data={data} />

      {/* Divisor */}
      <div className="border-t border-border/50" />

      {/* Benchmarking */}
      <BusinessBenchmarkCard businessId={businessId} days={days} />
    </div>
  );
};

export default BusinessInsightsContent;
