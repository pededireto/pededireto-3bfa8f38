import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches active business counts per category_id.
 * Counts businesses via business_subcategories → subcategories → category_id
 * so that businesses linked only through subcategories are also counted.
 * Returns a Map<categoryId, count>.
 */
export const useCategoryCounts = () => {
  return useQuery({
    queryKey: ["category-business-counts"],
    queryFn: async () => {
      // 1. Get all active business IDs with their direct category_id
      const { data: directData, error: directError } = await supabase
        .from("businesses")
        .select("id, category_id")
        .eq("is_active", true);

      if (directError) throw directError;

      // 2. Get subcategory → category mapping
      const { data: subcategories, error: subError } = await supabase
        .from("subcategories")
        .select("id, category_id");

      if (subError) throw subError;

      const subToCategoryMap = new Map<string, string>();
      for (const sub of subcategories ?? []) {
        subToCategoryMap.set(sub.id, sub.category_id);
      }

      // 3. Get all business_subcategories links
      const { data: businessSubs, error: bsError } = await supabase
        .from("business_subcategories")
        .select("business_id, subcategory_id");

      if (bsError) throw bsError;

      // Build set of active business IDs for fast lookup
      const activeBusinessIds = new Set((directData ?? []).map((b) => b.id));

      // 4. Count unique businesses per category
      // Use a Map<categoryId, Set<businessId>> to avoid double-counting
      const categoryBusinessSets = new Map<string, Set<string>>();

      const addToCat = (catId: string, bizId: string) => {
        if (!catId) return;
        let s = categoryBusinessSets.get(catId);
        if (!s) {
          s = new Set();
          categoryBusinessSets.set(catId, s);
        }
        s.add(bizId);
      };

      // Direct category_id
      for (const biz of directData ?? []) {
        if (biz.category_id) {
          addToCat(biz.category_id, biz.id);
        }
      }

      // Via subcategories
      for (const bs of businessSubs ?? []) {
        if (!activeBusinessIds.has(bs.business_id)) continue;
        const catId = subToCategoryMap.get(bs.subcategory_id);
        if (catId) {
          addToCat(catId, bs.business_id);
        }
      }

      // Also count via business_categories junction table
      const { data: businessCats, error: bcError } = await supabase
        .from("business_categories")
        .select("business_id, category_id");

      if (!bcError && businessCats) {
        for (const bc of businessCats) {
          if (activeBusinessIds.has(bc.business_id)) {
            addToCat(bc.category_id, bc.business_id);
          }
        }
      }

      const counts = new Map<string, number>();
      for (const [catId, bizSet] of categoryBusinessSets) {
        counts.set(catId, bizSet.size);
      }
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });
};
