import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryWithCategory extends Subcategory {
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export const useSubcategories = (categoryId?: string) => {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("subcategories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Subcategory[];
    },
  });
};

export const useAllSubcategories = () => {
  return useQuery({
    queryKey: ["subcategories", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as SubcategoryWithCategory[];
    },
  });
};

export const useSubcategory = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["subcategory", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("subcategories")
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as SubcategoryWithCategory | null;
    },
    enabled: !!slug,
  });
};

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subcategory: Omit<Subcategory, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("subcategories")
        .insert(subcategory)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
};

export const useUpdateSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subcategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("subcategories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
};

export const useDeleteSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subcategories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
};
