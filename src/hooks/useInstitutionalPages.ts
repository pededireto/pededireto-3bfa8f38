import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PageBlock {
  id: string;
  type: "text" | "image" | "gallery" | "columns" | "icon-list" | "cta-button" | "contacts" | "video" | "separator";
  title?: string;
  data: Record<string, any>;
}

export interface InstitutionalPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  page_type: "simple" | "advanced";
  blocks: PageBlock[];
  is_active: boolean;
  display_order: number;
  show_in_header: boolean;
  show_in_footer: boolean;
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
      return (data as any[]).map(mapPage);
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
      return (data as any[]).map(mapPage);
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
      return data ? mapPage(data as any) : null;
    },
    enabled: !!slug,
  });
};

export const useCreateInstitutionalPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (page: {
      title: string;
      slug: string;
      page_type: "simple" | "advanced";
      content?: string;
      blocks?: PageBlock[];
      is_active?: boolean;
      show_in_header?: boolean;
      show_in_footer?: boolean;
      meta_title?: string | null;
      meta_description?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("institutional_pages")
        .insert({
          title: page.title,
          slug: page.slug,
          page_type: page.page_type,
          content: page.content || null,
          blocks: (page.blocks || []) as any,
          is_active: page.is_active ?? true,
          show_in_header: page.show_in_header ?? true,
          show_in_footer: page.show_in_footer ?? true,
          meta_title: page.meta_title || null,
          meta_description: page.meta_description || null,
        } as any)
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

export const useUpdateInstitutionalPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstitutionalPage> & { id: string }) => {
      const payload: Record<string, any> = { ...updates };
      if (updates.blocks) payload.blocks = updates.blocks as any;
      
      const { data, error } = await supabase
        .from("institutional_pages")
        .update(payload as any)
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

export const useDeleteInstitutionalPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("institutional_pages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutional-pages"] });
    },
  });
};

function mapPage(raw: any): InstitutionalPage {
  return {
    ...raw,
    page_type: raw.page_type || "simple",
    blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
    show_in_header: raw.show_in_header ?? true,
    show_in_footer: raw.show_in_footer ?? true,
  };
}
