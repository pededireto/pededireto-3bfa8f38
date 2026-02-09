import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstitutionalPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  is_active: boolean;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export const useInstitutionalPages = () => {
  return useQuery({
    queryKey: ["institutional-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutional_pages")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as InstitutionalPage[];
    },
  });
};

export const useActiveInstitutionalPages = () => {
  return useQuery({
    queryKey: ["institutional-pages", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutional_pages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as InstitutionalPage[];
    },
    staleTime: 60000,
  });
};

export const useInstitutionalPage = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["institutional-page", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("institutional_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as InstitutionalPage | null;
    },
    enabled: !!slug,
  });
};

export const useUpdateInstitutionalPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstitutionalPage> & { id: string }) => {
      const { data, error } = await supabase
        .from("institutional_pages")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutional-pages"] });
    },
  });
};
