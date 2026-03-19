import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches active business counts per subcategory via junction table.
 * Returns a Map<subcategoryId, count>.
 */
export const useSubcategoryCounts = () => {
  return useQuery({
    queryKey: ["subcategory-business-counts"],
    queryFn: async () => {
      // Get all junction rows for active businesses
      const { data: junctions, error: jErr } = await supabase
        .from("business_subcategories")
        .select("subcategory_id, business_id");

      if (jErr) throw jErr;
      if (!junctions || junctions.length === 0) return new Map<string, number>();

      // Get active business IDs
      const { data: activeBusinesses, error: bErr } = await supabase
        .from("businesses")
        .select("id")
        .eq("is_active", true);

      if (bErr) throw bErr;

      const activeIds = new Set((activeBusinesses ?? []).map((b) => b.id));

      const counts = new Map<string, number>();
      for (const row of junctions) {
        if (!row.subcategory_id || !activeIds.has(row.business_id)) continue;
        counts.set(row.subcategory_id, (counts.get(row.subcategory_id) ?? 0) + 1);
      }
      return counts;
    },
    staleTime: 10 * 60 * 1000,
  });
};
