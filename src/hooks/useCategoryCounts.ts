import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches active business counts per category via server-side RPC.
 * Uses get_category_business_counts which aggregates from:
 * - businesses.category_id (direct)
 * - business_categories junction
 * - business_subcategories → subcategories → category_id
 * - businesses.subcategory_id → subcategories → category_id
 * Returns a Map<categoryId, count>.
 */
export const useCategoryCounts = () => {
  return useQuery({
    queryKey: ["category-business-counts"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_category_business_counts");

      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of (data ?? []) as { category_id: string; count: number }[]) {
        counts.set(row.category_id, Number(row.count));
      }
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });
};
