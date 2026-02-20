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

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Buscar eventos de view com search_log_id (veio de uma pesquisa)
      const { data: searchEvents, error } = await (supabase as any)
        .from("analytics_events")
        .select("search_log_id, position, created_at, city, category_id")
        .eq("business_id", businessId)
        .eq("event_type", "view")
        .not("search_log_id", "is", null)
        .gte("created_at", since.toISOString());

      if (error) throw error;

      const events = (searchEvents || []) as Array<{
        search_log_id: string;
        position: number | null;
        created_at: string;
        city: string | null;
        category_id: string | null;
      }>;

      if (events.length === 0) {
        return {
          total_searches_found: 0,
          top_terms: [],
          category_appearances: 0,
          city_appearances: 0,
        };
      }

      // Buscar os termos de pesquisa associados
      const searchLogIds = events.map(e => e.search_log_id).filter(Boolean);
      const { data: searchLogs, error: logsError } = await (supabase as any)
        .from("search_logs")
        .select("id, search_term, search_type, created_at")
        .in("id", searchLogIds);

      if (logsError) throw logsError;

      const logsMap = new Map((searchLogs || []).map((l: any) => [l.id, l]));

      // Agregar por termo
      const termMap = new Map<string, { count: number; positions: number[]; last_seen: string }>();

      for (const event of events) {
        const log = logsMap.get(event.search_log_id) as any;
        if (!log) continue;
        const term = log.search_term || log.search_type || "pesquisa direta";
        const existing = termMap.get(term) || { count: 0, positions: [], last_seen: event.created_at };
        existing.count += 1;
        if (event.position !== null) existing.positions.push(event.position);
        if (event.created_at > existing.last_seen) existing.last_seen = event.created_at;
        termMap.set(term, existing);
      }

      const top_terms: SearchPositionData[] = Array.from(termMap.entries())
        .map(([term, data]) => ({
          term,
          appearances: data.count,
          avg_position: data.positions.length > 0
            ? Math.round(data.positions.reduce((a, b) => a + b, 0) / data.positions.length)
            : null,
          last_seen: data.last_seen,
        }))
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 10);

      const categoryLogs = (searchLogs || []).filter((l: any) => l.search_type === "category");
      const cityLogs = (searchLogs || []).filter((l: any) => l.search_type === "city");

      return {
        total_searches_found: events.length,
        top_terms,
        category_appearances: categoryLogs.length,
        city_appearances: cityLogs.length,
      };
    },
    enabled: !!businessId,
    staleTime: 15 * 60 * 1000,
  });
};
