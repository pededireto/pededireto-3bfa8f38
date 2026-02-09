import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";

const BUSINESS_SELECT = `
  *,
  categories (id, name, slug, icon),
  subcategories (id, name, slug)
`;

export const useSuperHighlights = (limit: number = 6) => {
  return useQuery({
    queryKey: ["businesses", "super-highlights", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .eq("is_active", true)
        .eq("is_premium", true)
        .eq("premium_level", "SUPER")
        .order("display_order", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as unknown as BusinessWithCategory[];
    },
  });
};

export const useCategoryHighlights = (categoryId?: string, limit: number = 3) => {
  return useQuery({
    queryKey: ["businesses", "category-highlights", categoryId, limit],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .eq("is_active", true)
        .eq("is_premium", true)
        .in("premium_level", ["CATEGORIA", "SUPER"])
        .eq("category_id", categoryId)
        .order("display_order", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as unknown as BusinessWithCategory[];
    },
    enabled: !!categoryId,
  });
};
