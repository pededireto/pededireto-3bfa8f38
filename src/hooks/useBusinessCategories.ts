import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessCategory {
  category_id: string;
  is_primary: boolean;
}

export const useBusinessCategoryIds = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business_categories", businessId],
    queryFn: async (): Promise<BusinessCategory[]> => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_categories")
        .select("category_id, is_primary")
        .eq("business_id", businessId)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return (data || []) as BusinessCategory[];
    },
    enabled: !!businessId,
  });
};

export const useSyncBusinessCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      categoryIds,
      primaryCategoryId,
    }: {
      businessId: string;
      categoryIds: string[];
      primaryCategoryId: string;
    }) => {
      // 1. Delete existing
      const { error: deleteError } = await supabase
        .from("business_categories")
        .delete()
        .eq("business_id", businessId);

      if (deleteError) throw deleteError;

      // 2. Insert new
      if (categoryIds.length === 0) return;

      const rows = categoryIds.map((catId) => ({
        business_id: businessId,
        category_id: catId,
        is_primary: catId === primaryCategoryId,
      }));

      const { error: insertError } = await supabase
        .from("business_categories")
        .insert(rows);

      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business_categories", variables.businessId],
      });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
  });
};
