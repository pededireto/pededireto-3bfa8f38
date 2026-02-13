import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessIntelligenceData {
  impressions: number;
  clicks: number;
  ctr: number;
  searches_in_category: number;
  searches_in_city: number;
  trend: { day: string; impressions: number; clicks: number }[];
  position_average: number;
}

export const useBusinessIntelligence = (businessId: string | null | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ["intelligence", "business", businessId, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_intelligence" as any, {
        p_business_id: businessId,
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as BusinessIntelligenceData;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
};
