import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches active business counts per subcategory via RPC.
 * Uses a server-side function to avoid the 1000 row limit.
 * Returns a Map<subcategoryId, count>.
 */
export const useSubcategoryCounts = () => {
  return useQuery({
    queryKey: ["subcategory-business-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_subcategory_business_counts");

      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.subcategory_id, Number(row.count));
      }
      return counts;
    },
    staleTime: 10 * 60 * 1000,
  });
};
