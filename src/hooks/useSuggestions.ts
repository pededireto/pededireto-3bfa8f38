import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Suggestion {
  id: string;
  city_name: string;
  email: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
}

export interface SuggestionInput {
  city_name: string;
  email?: string | null;
  message?: string | null;
}

export const useCreateSuggestion = () => {
  return useMutation({
    mutationFn: async (suggestion: SuggestionInput) => {
      const { data, error } = await supabase
        .from("suggestions")
        .insert(suggestion)
        .select()
        .single();
      
      if (error) throw error;
      return data as Suggestion;
    },
    onError: (error: any) => {
      console.error("[useCreateSuggestion] error:", error);
    },
  });
};

export const useSuggestions = () => {
  return useQuery({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Suggestion[];
    },
  });
};

export const useDeleteSuggestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suggestions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (error: any) => {
      console.error("[useDeleteSuggestion] error:", error);
    },
  });
};

export const useUpdateSuggestionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("suggestions")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (error: any) => {
      console.error("[useUpdateSuggestionStatus] error:", error);
    },
  });
};
