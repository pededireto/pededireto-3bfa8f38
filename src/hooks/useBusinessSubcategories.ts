import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessSubcategory {
  id: string;
  business_id: string;
  subcategory_id: string;
  created_at: string;
}

export const useBusinessSubcategoryIds = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business_subcategories", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_subcategories")
        .select("subcategory_id")
        .eq("business_id", businessId);

      if (error) throw error;
      return data.map((d) => d.subcategory_id);
    },
    enabled: !!businessId,
  });
};

export const useSubcategoryBusinessCounts = () => {
  return useQuery({
    queryKey: ["business_subcategories", "counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_subcategories")
        .select("subcategory_id, business_id");

      if (error) throw error;

      const grouped = new Map<string, Set<string>>();
      (data || []).forEach(({ subcategory_id, business_id }) => {
        if (!grouped.has(subcategory_id)) grouped.set(subcategory_id, new Set());
        grouped.get(subcategory_id)?.add(business_id);
      });

      return Object.fromEntries(
        Array.from(grouped.entries()).map(([subcategoryId, businessIds]) => [subcategoryId, businessIds.size])
      ) as Record<string, number>;
    },
  });
};

export const useSyncBusinessSubcategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      subcategoryIds,
    }: {
      businessId: string;
      subcategoryIds: string[];
    }) => {
      // Delete all existing
      const { error: deleteError } = await supabase
        .from("business_subcategories")
        .delete()
        .eq("business_id", businessId);

      if (deleteError) throw deleteError;

      // Insert new ones
      if (subcategoryIds.length > 0) {
        const rows = subcategoryIds.map((subcategory_id) => ({
          business_id: businessId,
          subcategory_id,
        }));

        const { error: insertError } = await supabase
          .from("business_subcategories")
          .insert(rows);

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business_subcategories", variables.businessId],
      });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
    onError: (error: any) => {
      console.error("[useSyncBusinessSubcategories] error:", error);
    },
  });
};
