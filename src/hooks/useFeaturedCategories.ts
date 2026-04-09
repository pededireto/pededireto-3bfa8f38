import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedCategory {
  id: string;
  category_id: string;
  cover_image_url: string | null;
  video_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: {
    name: string;
    slug: string;
    icon: string | null;
    image_url: string | null;
    video_url: string | null;
  } | null;
}

export const useFeaturedCategories = () => {
  return useQuery({
    queryKey: ["featured_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_categories" as any)
        .select("*, categories(name, slug, icon, image_url, video_url)")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as any[]).filter((fc: any) => fc.categories !== null) as FeaturedCategory[];
    },
  });
};

export const useAllFeaturedCategories = () => {
  return useQuery({
    queryKey: ["featured_categories", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_categories" as any)
        .select("*, categories(name, slug, icon, image_url, video_url)")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as unknown as FeaturedCategory[];
    },
  });
};

export const useCreateFeaturedCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      category_id: string;
      cover_image_url: string;
      display_order: number;
      is_active: boolean;
    }) => {
      const { data, error } = await supabase
        .from("featured_categories" as any)
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured_categories"] });
    },
    onError: (error: any) => {
      console.error("[useCreateFeaturedCategory] error:", error);
    },
  });
};

export const useUpdateFeaturedCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      cover_image_url?: string;
      display_order?: number;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("featured_categories" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured_categories"] });
    },
    onError: (error: any) => {
      console.error("[useUpdateFeaturedCategory] error:", error);
    },
  });
};

export const useDeleteFeaturedCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("featured_categories" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured_categories"] });
    },
    onError: (error: any) => {
      console.error("[useDeleteFeaturedCategory] error:", error);
    },
  });
};
