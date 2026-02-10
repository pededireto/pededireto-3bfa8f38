import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLogSearch } from "@/hooks/useSearchLogs";
import { useEffect, useRef } from "react";

export interface SearchResult {
  result_type: string;
  result_id: string;
  result_name: string;
  result_slug: string;
  category_name: string;
  category_slug: string;
  relevance: number;
}

export const useSearch = (term: string) => {
  const debouncedTerm = term.trim();
  const logSearch = useLogSearch();
  const lastLoggedRef = useRef<string>("");

  const query = useQuery({
    queryKey: ["search", debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 2) return [];

      const { data, error } = await supabase.rpc(
        "search_businesses_and_subcategories",
        { search_term: debouncedTerm }
      );

      if (error) throw error;
      
      const sorted = (data || []).sort((a, b) => a.relevance - b.relevance);
      
      const seen = new Set<string>();
      return sorted.filter((item) => {
        const key = `${item.result_type}-${item.result_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 10) as SearchResult[];
    },
    enabled: debouncedTerm.length >= 2,
    staleTime: 30000,
  });

  // Log zero-result searches (debounced, only once per term)
  useEffect(() => {
    if (
      query.isSuccess &&
      query.data?.length === 0 &&
      debouncedTerm.length >= 2 &&
      lastLoggedRef.current !== debouncedTerm
    ) {
      lastLoggedRef.current = debouncedTerm;
      logSearch.mutate({
        search_term: debouncedTerm,
        results_count: 0,
        search_type: "general",
      });
    }
  }, [query.isSuccess, query.data?.length, debouncedTerm]);

  return query;
};
