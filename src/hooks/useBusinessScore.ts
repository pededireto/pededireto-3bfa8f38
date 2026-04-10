import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingSnapshot {
  snapshot_date: string;
  score: number;
  position: number;
}

export interface BusinessScoreData {
  score: number;
  updated_at: string;
}

export const useBusinessScore = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-score", businessId],
    queryFn: async (): Promise<BusinessScoreData | null> => {
      if (!businessId) return null;
      const { data, error } = await (supabase as any)
        .from("business_scores")
        .select("score, updated_at")
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });
};

export const useRankingHistory = (businessId: string | null, days = 30) => {
  return useQuery({
    queryKey: ["ranking-history", businessId, days],
    queryFn: async (): Promise<RankingSnapshot[]> => {
      if (!businessId) return [];
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await (supabase as any)
        .from("business_ranking_snapshots")
        .select("snapshot_date, score, position")
        .eq("business_id", businessId)
        .gte("snapshot_date", since.toISOString().split("T")[0])
        .order("snapshot_date", { ascending: true });

      if (error) throw error;
      return (data || []) as RankingSnapshot[];
    },
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
};
