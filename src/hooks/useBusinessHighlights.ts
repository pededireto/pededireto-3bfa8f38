import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessHighlight {
  id: string;
  business_id: string;
  level: "super" | "category" | "subcategory";
  category_id: string | null;
  subcategory_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  businesses?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    city: string | null;
    plan_id: string | null;
  } | null;
  categories?: { id: string; name: string } | null;
  subcategories?: { id: string; name: string } | null;
}

const HIGHLIGHT_SELECT = `
  *,
  businesses (id, name, slug, logo_url, city, plan_id),
  categories (id, name),
  subcategories (id, name)
`;

export const useBusinessHighlights = (level?: string, categoryId?: string, subcategoryId?: string) => {
  return useQuery({
    queryKey: ["business-highlights", level, categoryId, subcategoryId],
    queryFn: async () => {
      let query = supabase
        .from("business_highlights" as any)
        .select(HIGHLIGHT_SELECT)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (level) query = query.eq("level", level);
      if (categoryId) query = query.eq("category_id", categoryId);
      if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as BusinessHighlight[];
    },
  });
};

export const useAllBusinessHighlights = () => {
  return useQuery({
    queryKey: ["business-highlights", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_highlights" as any)
        .select(HIGHLIGHT_SELECT)
        .order("level", { ascending: true })
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as unknown as BusinessHighlight[];
    },
  });
};

export const useCreateHighlight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (highlight: {
      business_id: string;
      level: string;
      category_id?: string | null;
      subcategory_id?: string | null;
      display_order?: number;
      start_date?: string | null;
      end_date?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("business_highlights" as any)
        .insert(highlight as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-highlights"] }),
    onError: (error: any) => {
      console.error("[useCreateHighlight] error:", error);
    },
  });
};

export const useUpdateHighlight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<BusinessHighlight>) => {
      const { data, error } = await supabase
        .from("business_highlights" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-highlights"] }),
    onError: (error: any) => {
      console.error("[useUpdateHighlight] error:", error);
    },
  });
};

export const useDeleteHighlight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_highlights" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-highlights"] }),
    onError: (error: any) => {
      console.error("[useDeleteHighlight] error:", error);
    },
  });
};
