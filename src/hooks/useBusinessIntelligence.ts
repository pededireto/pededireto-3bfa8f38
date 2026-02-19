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

      // Mapear estrutura aninhada para o formato esperado pelo componente
      const raw = data as any;
      return {
        impressions: raw?.summary?.impressions ?? 0,
        clicks: raw?.summary?.clicks ?? 0,
        ctr: raw?.summary?.ctr ?? 0,
        position_average: raw?.summary?.avg_position ?? 0,
        searches_in_category: raw?.demand?.category_searches ?? 0,
        searches_in_city: raw?.demand?.city_searches ?? 0,
        trend: (raw?.trend ?? []).map((t: any) => ({
          day: t.day?.split("T")[0] ?? t.day,
          impressions: t.impressions ?? 0,
          clicks: t.clicks ?? 0,
        })),
      } as BusinessIntelligenceData;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
};
