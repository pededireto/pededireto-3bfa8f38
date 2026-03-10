import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BenchmarkData {
  my_stats: {
    views: number;
    clicks: number;
    whatsapp?: number;
    phone?: number;
    website?: number;
    email?: number;
  };
  ranking: {
    city_rank: number | null;
    city_total: number;
    subcat_rank: number | null;
    subcat_total: number;
  };
  category_stats: {
    name: string;
    total_businesses: number;
    total_views: number;
    total_clicks: number;
    avg_views: number;
    avg_clicks: number;
  };
  subcategory_stats: {
    name: string;
    total_businesses: number;
    total_views: number;
    avg_views: number;
    avg_clicks: number;
  };
  city_stats: {
    city: string;
    total_businesses: number;
    avg_views: number | null;
    avg_clicks: number | null;
  };
}

export const useBusinessBenchmark = (
  businessId: string | null | undefined,
  days: number = 30,
  subcategoryId?: string | null
) => {
  return useQuery({
    queryKey: ["business-benchmark", businessId, days, subcategoryId ?? null],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        p_business_id: businessId,
        p_days: days,
      };
      if (subcategoryId) {
        params.p_subcategory_id = subcategoryId;
      }
      const { data, error } = await (supabase as any).rpc(
        "get_business_benchmark_v2",
        params
      );
      if (error) throw error;
      return data as BenchmarkData;
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });
};
