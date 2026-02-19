import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileScoreData {
  score: number;
  max: number;
  percentage: number;
  suggestions: string[];
}

export const useBusinessProfileScore = (businessId: string | null | undefined) => {
  return useQuery({
    queryKey: ["business-profile-score", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_profile_score" as any, {
        p_business_id: businessId,
      });
      if (error) throw error;
      const raw = data as any;
      return {
        score: raw?.score ?? 0,
        max: raw?.max ?? 100,
        percentage: raw?.percentage ?? 0,
        suggestions: raw?.suggestions ?? [],
      } as ProfileScoreData;
    },
    enabled: !!businessId,
    staleTime: 60 * 1000,
  });
};
