import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  video_url: string | null;
  alcance_default: "local" | "nacional" | "hibrido";
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useAllCategories = () => {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useCategory = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();

      if (error) throw error;
      return data as Category | null;
    },
    enabled: !!slug,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<Category, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("categories").insert(category).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      console.error("[useCreateCategory] error:", error);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      console.error("[useUpdateCategory] error:", error);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      console.error("[useDeleteCategory] error:", error);
    },
  });
};
