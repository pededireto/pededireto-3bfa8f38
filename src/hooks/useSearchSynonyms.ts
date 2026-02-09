import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchSynonym {
  id: string;
  termo: string;
  equivalente: string;
  created_at: string;
}

export const useSearchSynonyms = () => {
  return useQuery({
    queryKey: ["search-synonyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_synonyms")
        .select("*")
        .order("termo", { ascending: true });

      if (error) throw error;
      return data as SearchSynonym[];
    },
  });
};

export const useCreateSearchSynonym = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (synonym: { termo: string; equivalente: string }) => {
      const { data, error } = await supabase
        .from("search_synonyms")
        .insert(synonym as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-synonyms"] });
    },
  });
};

export const useDeleteSearchSynonym = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("search_synonyms")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-synonyms"] });
    },
  });
};
