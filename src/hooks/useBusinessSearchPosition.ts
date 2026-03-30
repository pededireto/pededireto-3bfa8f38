import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchPositionData {
  term: string;
  appearances: number;
  avg_position: number | null;
  last_seen: string;
}

export interface SearchPositionSummary {
  total_searches_found: number;
  top_terms: SearchPositionData[];
  category_appearances: number;
  city_appearances: number;
}

export const useBusinessSearchPosition = (businessId: string | null | undefined, days = 30) => {
  return useQuery({
    queryKey: ["business-search-position", businessId, days],
    queryFn: async (): Promise<SearchPositionSummary> => {
      if (!businessId) throw new Error("businessId required");

      // 1. Get business name + subcategory names as search terms
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .select("name, city")
        .eq("id", businessId)
        .single();
      if (bizErr) throw bizErr;

      const { data: subLinks } = await (supabase as any)
        .from("business_subcategories")
        .select("subcategory_id")
        .eq("business_id", businessId);

      const subIds = (subLinks || []).map((s: any) => s.subcategory_id).filter(Boolean);
      let subNames: string[] = [];
      if (subIds.length > 0) {
        const { data: subs } = await supabase
          .from("subcategories")
          .select("name")
          .in("id", subIds);
        subNames = (subs || []).map((s) => s.name);
      }

      // Build search terms from business name words + subcategory names
      const terms: string[] = [];
      if (biz?.name) {
        // Use full name and meaningful words (>2 chars)
        terms.push(biz.name);
        biz.name.split(/\s+/).filter((w: string) => w.length > 2).forEach((w: string) => terms.push(w));
      }
      subNames.forEach((n) => terms.push(n));

      // Deduplicate and lowercase
      const uniqueTerms = [...new Set(terms.map((t) => t.toLowerCase()))];

      if (uniqueTerms.length === 0) {
        return { total_searches_found: 0, top_terms: [], category_appearances: 0, city_appearances: 0 };
      }

      const since = new Date();
      since.setDate(since.getDate() - days);

      // 2. Search search_intelligence_logs for matching input_text
      const { data: logs, error: logsErr } = await supabase
        .from("search_intelligence_logs")
        .select("id, input_text, created_at, user_city")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsErr) throw logsErr;
      const allLogs = logs || [];

      // 3. Filter logs that match any of our terms (ilike)
      const matchedLogs = allLogs.filter((log) => {
        const input = (log.input_text || "").toLowerCase();
        return uniqueTerms.some((term) => input.includes(term));
      });

      if (matchedLogs.length === 0) {
        return { total_searches_found: 0, top_terms: [], category_appearances: 0, city_appearances: 0 };
      }

      // 4. Aggregate by input_text
      const termMap = new Map<string, { count: number; last_seen: string }>();
      let cityAppearances = 0;

      for (const log of matchedLogs) {
        const input = log.input_text || "pesquisa direta";
        const existing = termMap.get(input) || { count: 0, last_seen: log.created_at || "" };
        existing.count += 1;
        if ((log.created_at || "") > existing.last_seen) existing.last_seen = log.created_at || "";
        termMap.set(input, existing);

        if (biz?.city && log.user_city && log.user_city.toLowerCase() === biz.city.toLowerCase()) {
          cityAppearances++;
        }
      }

      const top_terms: SearchPositionData[] = Array.from(termMap.entries())
        .map(([term, data]) => ({
          term,
          appearances: data.count,
          avg_position: null, // Position not available from search_intelligence_logs
          last_seen: data.last_seen,
        }))
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 10);

      return {
        total_searches_found: matchedLogs.length,
        top_terms,
        category_appearances: 0,
        city_appearances: cityAppearances,
      };
    },
    enabled: !!businessId,
    staleTime: 15 * 60 * 1000,
  });
};
