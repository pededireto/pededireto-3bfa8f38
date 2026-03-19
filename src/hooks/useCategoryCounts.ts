import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches active business counts per category_id.
 * Returns a Map<categoryId, count>.
 */
export const useCategoryCounts = () => {
  return useQuery({
    queryKey: ["category-business-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("category_id")
        .eq("is_active", true)
        .not("category_id", "is", null);

      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        if (!row.category_id) continue;
        counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
      }
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });
};
