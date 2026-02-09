import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      // Convert to a key-value map
      const map: Record<string, string> = {};
      (data as SiteSetting[]).forEach((s) => {
        map[s.key] = s.value || "";
      });
      return map;
    },
    staleTime: 60000,
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value } as any)
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};

export const useBulkUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const promises = Object.entries(settings).map(([key, value]) =>
        supabase
          .from("site_settings")
          .update({ value } as any)
          .eq("key", key)
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};
