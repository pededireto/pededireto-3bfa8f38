import { useState } from "react";
import { Loader2, Brain } from "lucide-react";
import { useAdminIntelligence } from "@/hooks/useAdminIntelligence";
import DateRangeFilter from "@/components/intelligence/DateRangeFilter";
import ExecutiveCards from "@/components/intelligence/ExecutiveCards";
import RevenueChart from "@/components/intelligence/RevenueChart";
import SearchDemandChart from "@/components/intelligence/SearchDemandChart";
import MarketplaceHealth from "@/components/intelligence/MarketplaceHealth";
import TopTermsTable from "@/components/intelligence/TopTermsTable";

const IntelligenceCenterContent = () => {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useAdminIntelligence(days);

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
        <p className="text-muted-foreground">Erro ao carregar dados de intelligence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Intelligence Center</h1>
        </div>
        <DateRangeFilter days={days} onChange={setDays} />
      </div>

      <ExecutiveCards data={data.executive} />
      <RevenueChart data={data.revenue.monthly_revenue} conversionsByPlan={data.revenue.conversions_by_plan} />
      <SearchDemandChart search={data.search} />
      <MarketplaceHealth data={data.marketplace} />
      <TopTermsTable terms={data.search.top_terms} noResultPercent={data.search.no_result_percent} />
    </div>
  );
};

export default IntelligenceCenterContent;
