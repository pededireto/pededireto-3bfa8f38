import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BenchmarkData {
  my_stats: {
    views: number;
    clicks: number;
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

export const useBusinessBenchmark = (businessId: string | null | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ["business-benchmark", businessId, days],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_business_benchmark", {
        p_business_id: businessId,
        p_days: days,
      });
      if (error) throw error;
      return data as BenchmarkData;
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });
};
