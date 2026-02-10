import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useSavedSearches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-searches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAutoSaveSearch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ searchQuery, filters }: { searchQuery: string; filters?: Record<string, string> }) => {
      if (!user) return; // silently skip if not authenticated

      // Check for existing identical search
      const { data: existing } = await supabase
        .from("saved_searches")
        .select("id")
        .eq("user_id", user.id)
        .eq("search_query", searchQuery)
        .maybeSingle();

      if (existing) {
        // Update timestamp only
        await supabase
          .from("saved_searches")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("saved_searches")
          .insert([{
            user_id: user.id,
            search_query: searchQuery,
            filters: filters ?? {},
          }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });
};

export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });
};
