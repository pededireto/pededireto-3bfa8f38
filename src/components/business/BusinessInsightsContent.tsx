import { useState } from "react";
import { Loader2, TrendingUp, Lock, Download } from "lucide-react";
import { useBusinessIntelligence, getPeakHourLabel, getPeakDowLabel } from "@/hooks/useBusinessIntelligence";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import { useBusinessBenchmark } from "@/hooks/useBusinessBenchmark";
import {
  useBusinessFavorites,
  useBusinessProfileScore,
  useBusinessServiceRequests,
  useBusinessReviewsData,
  useBusinessBadges,
  useBusinessMonthlyHistory,
} from "@/hooks/useBusinessDashboardPro";
import DateRangeFilter from "@/components/intelligence/DateRangeFilter";
import BusinessPerformanceCard from "@/components/intelligence/BusinessPerformanceCard";
import BusinessBenchmarkCard from "@/components/intelligence/BusinessBenchmarkCard";
import BenchmarkInsightsPanel from "@/components/intelligence/BenchmarkInsightsPanel";
import UpgradeAnalyticsCard from "@/components/intelligence/UpgradeAnalyticsCard";
import SectorBenchmarkPanel from "@/components/intelligence/SectorBenchmarkPanel";
import {
  FavoritesCard,
  ProfileScoreCard,
  ServiceRequestsCard,
  ReviewsCard,
  BadgesCard,
  MonthlyHistoryCard,
} from "@/components/business/BusinessProWidgets";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface BusinessInsightsContentProps {
  businessId: string;
  planId: string | null;
  claimStatus?: string;
  forceProAccess?: boolean;
}

const BusinessInsightsContent = ({
  businessId,
  planId,
  claimStatus = "verified",
  forceProAccess = false,
}: BusinessInsightsContentProps) => {
  const [days, setDays] = useState(30);
  const { data: planRule, isLoading: ruleLoading } = usePlanRuleByPlanId(planId);
  const { data: analytics } = useBusinessAnalytics(
    claimStatus === "verified" || forceProAccess ? businessId : null,
    days,
  );

  const isVerified = claimStatus === "verified" || forceProAccess;
  const hasProAccess = forceProAccess || !!(planRule as any)?.allow_analytics_pro;
  const hasBasicAccess = (planRule as any)?.allow_analytics_basic !== false;

  // Hooks PRO — só carregam se tiver acesso
  const { data: favorites } = useBusinessFavorites(isVerified && hasProAccess ? businessId : null);
  const { data: profileScore } = useBusinessProfileScore(isVerified && hasProAccess ? businessId : null);
  const { data: serviceRequests } = useBusinessServiceRequests(isVerified && hasProAccess ? businessId : null);
  const { data: reviewsData } = useBusinessReviewsData(isVerified && hasProAccess ? businessId : null);
  const { data: badges } = useBusinessBadges(isVerified && hasProAccess ? businessId : null);
  const { data: monthlyHistory } = useBusinessMonthlyHistory(isVerified && hasProAccess ? businessId : null);
  const { data: benchmarkData, isLoading: benchmarkLoading } = useBusinessBenchmark(
    isVerified && hasProAccess ? businessId : null,
    days,
  );

  const { data, isLoading, error } = useBusinessIntelligence(isVerified && hasProAccess ? businessId : null, days);

  // Bloqueado se não verificado
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

  // Plano Free: básico + upsell
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
              <p className="text-xs text-muted-foreground mt-1">
                📞{analytics?.breakdown.phone ?? 0} · 💬{analytics?.breakdown.whatsapp ?? 0}
              </p>
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

  // Plano PRO: acesso completo
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

  const exportToCSV = () => {
    if (!data) return;
    const rows = [
      ["Métrica", "Valor", "Período"],
      ["Impressões", data.impressions ?? 0, `Últimos ${days} dias`],
      ["Cliques", data.clicks ?? 0, `Últimos ${days} dias`],
      ["CTR", (data.ctr ?? 0) + "%", `Últimos ${days} dias`],
      ["Pesquisas na categoria", data.searches_in_category ?? 0, `Últimos ${days} dias`],
      ["Pesquisas na cidade", data.searches_in_city ?? 0, `Últimos ${days} dias`],
      ["Posição média", data.position_average ?? "-", `Últimos ${days} dias`],
      ["Cliques Telefone", data.contacts?.click_phone ?? 0, "Total"],
      ["Cliques WhatsApp", data.contacts?.click_whatsapp ?? 0, "Total"],
      ["Cliques Email", data.contacts?.click_email ?? 0, "Total"],
      ["Cliques Website", data.contacts?.click_website ?? 0, "Total"],
      ["Hora de pico", getPeakHourLabel(data.peak_hour), "-"],
      ["Dia mais activo", getPeakDowLabel(data.peak_dow), "-"],
      ["Impressões período anterior", data.previous?.impressions ?? 0, "Anterior"],
      ["Cliques período anterior", data.previous?.clicks ?? 0, "Anterior"],
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `insights-${businessId}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Insights PRO</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
          <DateRangeFilter days={days} onChange={setDays} />
        </div>
      </div>

      {/* Performance existente (sem alterações) */}
      <BusinessPerformanceCard data={data} />

      {/* Favoritos + Score do Perfil — lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <FavoritesCard count={favorites ?? 0} />
        </div>
        <div className="md:col-span-2">{profileScore?.fields && <ProfileScoreCard data={profileScore} />}</div>
      </div>

      <div className="border-t border-border/50" />

      {/* Pedidos de Serviço */}
      {serviceRequests && <ServiceRequestsCard data={serviceRequests} />}

      <div className="border-t border-border/50" />

      {/* Avaliações + Badges — lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviewsData && <ReviewsCard data={reviewsData} />}
        {badges !== undefined && <BadgesCard badges={badges} />}
      </div>

      <div className="border-t border-border/50" />

      {/* Histórico Mensal */}
      {monthlyHistory && <MonthlyHistoryCard data={monthlyHistory} />}

      <div className="border-t border-border/50" />

      {/* Benchmarking original + novo PRO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BusinessBenchmarkCard businessId={businessId} days={days} />
        <BenchmarkInsightsPanel data={benchmarkData} isLoading={benchmarkLoading} />
      </div>

      <div className="border-t border-border/50" />

      {/* Benchmarking Sectorial Z.AI */}
      <SectorBenchmarkPanel businessId={businessId} />
    </div>
  );
};

export default BusinessInsightsContent;
