import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminIntelligenceData {
  executive: {
    total_users: number;
    total_businesses: number;
    active_businesses: number;
    total_requests: number;
    total_searches: number;
    revenue_this_month: number;
    mrr_estimate: number;
  };
  revenue: {
    monthly_revenue: { month: string; total: number }[];
    conversions_by_plan: { plan_name: string; total: number }[];
    revenue_by_commercial: { commercial_name: string; total: number }[];
  };
  search: {
    total_searches: number;
    no_result_percent: number;
    top_terms: { term: string; total: number }[];
    searches_by_city: { city: string; total: number }[];
    intent_breakdown: { intent: string; total: number }[];
  };
  marketplace: {
    request_business_ratio: number;
    inactive_businesses: number;
    avg_response_time: number;
  };
}

export const useAdminIntelligence = (days: number = 30) => {
  return useQuery({
    queryKey: ["intelligence", "admin", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_intelligence" as any, {
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as AdminIntelligenceData;
    },
    staleTime: 5 * 60 * 1000,
  });
};
