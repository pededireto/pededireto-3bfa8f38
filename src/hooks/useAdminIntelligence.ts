import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminIntelligenceData {
  executive: {
    total_users: number;
    total_businesses: number;
    active_businesses: number;
    inactive_businesses: number;
    total_requests: number;
    total_searches: number;
    revenue_this_month: number;
    mrr_estimate: number;
    new_businesses: number;
    new_users: number;
    activation_rate: number;
  };
  revenue: {
    conversions_by_plan: { plan_name: string; total: number; revenue: number }[];
    plan_distribution: { plan_name: string; total: number }[];
    revenue_by_plan: { plan_name: string; businesses: number; revenue: number }[];
    expiring_soon: number;
    monthly_conversions: { month: string; total: number; revenue: number }[];
  };
  search: {
    total_searches: number;
    no_result_percent: number;
    top_terms: { term: string; total: number }[];
    zero_result_terms: { term: string; total: number }[];
    daily_searches: { day: string; total: number }[];
  };
  marketplace: {
    request_business_ratio: number;
    inactive_businesses: number;
    pending_requests: number;
    requests_by_status: { status: string; total: number }[];
    requests_by_city: { city: string; total: number }[];
    avg_resolution_time: number;
    total_clicks: number;
    total_views: number;
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
