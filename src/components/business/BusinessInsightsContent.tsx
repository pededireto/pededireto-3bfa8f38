import { useState } from "react";
import { Loader2, TrendingUp, Lock } from "lucide-react";
import { useBusinessIntelligence } from "@/hooks/useBusinessIntelligence";
import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import DateRangeFilter from "@/components/intelligence/DateRangeFilter";
import BusinessPerformanceCard from "@/components/intelligence/BusinessPerformanceCard";
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
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-1">Disponível em breve</p>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground">Cliques Telefone</p>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-1">Disponível em breve</p>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground">Cliques Website</p>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-1">Disponível em breve</p>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 flex items-center justify-center rounded-xl">
            <div className="text-center space-y-2 p-6">
              <Lock className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold text-lg">Desbloqueie o Analytics Pro</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Aceda a analytics avançados, leads detalhadas, heatmaps e receita estimada com um plano pago.
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
