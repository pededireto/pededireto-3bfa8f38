import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loads all business_subcategories rows and builds a Map<businessId, subcategoryId[]>
 * for efficient client-side subcategory filtering.
 */
export const useBusinessSubcategoryMap = () => {
  return useQuery({
    queryKey: ["business_subcategories", "map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_subcategories")
        .select("business_id, subcategory_id");

      if (error) throw error;

      const map = new Map<string, string[]>();
      (data || []).forEach(({ business_id, subcategory_id }) => {
        if (!map.has(business_id)) map.set(business_id, []);
        map.get(business_id)!.push(subcategory_id);
      });

      return map;
    },
  });
};
