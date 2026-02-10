import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InstitutionalPage } from "@/hooks/useInstitutionalPages";

function mapPage(raw: any): InstitutionalPage {
  return {
    ...raw,
    page_type: raw.page_type || "simple",
    blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
    show_in_header: raw.show_in_header ?? true,
    show_in_footer: raw.show_in_footer ?? true,
  };
}

export const useHeaderPages = () => {
  return useQuery({
    queryKey: ["institutional-pages", "header"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutional_pages")
        .select("*")
        .eq("is_active", true)
        .eq("show_in_header", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data as any[]).map(mapPage);
    },
    staleTime: 60000,
  });
};

export const useFooterPages = () => {
  return useQuery({
    queryKey: ["institutional-pages", "footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutional_pages")
        .select("*")
        .eq("is_active", true)
        .eq("show_in_footer", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data as any[]).map(mapPage);
    },
    staleTime: 60000,
  });
};
