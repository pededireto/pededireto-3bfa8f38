import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  return useQuery({
    queryKey: ["search", debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 2) return [];

      const { data, error } = await supabase.rpc(
        "search_businesses_and_subcategories",
        { search_term: debouncedTerm }
      );

      if (error) throw error;
      
      // Sort by relevance and deduplicate
      const sorted = (data || []).sort((a, b) => a.relevance - b.relevance);
      
      // Deduplicate by result_id + result_type
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
};
