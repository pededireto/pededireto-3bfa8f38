import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchLog {
  id: string;
  search_term: string;
  search_type: string;
  results_count: number;
  is_reviewed: boolean;
  created_at: string;
}

export interface SearchLogAggregated {
  search_term: string;
  count: number;
  last_searched: string;
  is_reviewed: boolean;
}

export const useLogSearch = () => {
  return useMutation({
    mutationFn: async ({
      search_term,
      results_count,
      search_type = "general",
    }: {
      search_term: string;
      results_count: number;
      search_type?: string;
    }) => {
      // Only log searches with 0 results
      if (results_count > 0) return;

      const { error } = await supabase
        .from("search_logs" as any)
        .insert({
          search_term: search_term.toLowerCase().trim(),
          search_type,
          results_count,
          is_reviewed: false,
        } as any);

      if (error) throw error;
    },
  });
};

export const useSearchLogs = () => {
  return useQuery({
    queryKey: ["search-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_logs" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as SearchLog[];
    },
  });
};

export const useSearchLogsAggregated = () => {
  return useQuery({
    queryKey: ["search-logs", "aggregated"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_logs" as any)
        .select("*")
        .eq("results_count", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const logs = data as unknown as SearchLog[];
      const map = new Map<string, SearchLogAggregated>();

      for (const log of logs) {
        const key = log.search_term.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count++;
          if (log.created_at > existing.last_searched) {
            existing.last_searched = log.created_at;
          }
          if (!log.is_reviewed) existing.is_reviewed = false;
        } else {
          map.set(key, {
            search_term: log.search_term,
            count: 1,
            last_searched: log.created_at,
            is_reviewed: log.is_reviewed,
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    },
  });
};

export const useMarkSearchReviewed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const { error } = await supabase
        .from("search_logs" as any)
        .update({ is_reviewed: true } as any)
        .ilike("search_term", searchTerm);

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search-logs"] }),
  });
};

export const useDeleteSearchLogs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const { error } = await supabase
        .from("search_logs" as any)
        .delete()
        .ilike("search_term", searchTerm);

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search-logs"] }),
  });
};
