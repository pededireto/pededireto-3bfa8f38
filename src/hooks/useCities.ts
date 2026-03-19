import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CityOption {
  name: string;
  count: number;
}

/**
 * Fetches distinct cities from active businesses, ordered by business count.
 * Uses business_cities table (multi-city) with fallback to businesses.city.
 */
export const useCities = (limit = 30) => {
  return useQuery({
    queryKey: ["cities-dynamic", limit],
    queryFn: async (): Promise<CityOption[]> => {
      // Try business_cities first (multi-city architecture)
      const { data: multiCities, error: multiError } = await supabase
        .from("business_cities")
        .select("city_name, business_id");

      if (!multiError && multiCities && multiCities.length > 0) {
        // Get active business IDs
        const { data: activeBusinesses } = await supabase
          .from("businesses")
          .select("id")
          .eq("is_active", true);

        const activeIds = new Set((activeBusinesses ?? []).map((b) => b.id));

        // Count businesses per city (only active)
        const cityMap = new Map<string, number>();
        for (const row of multiCities) {
          if (!activeIds.has(row.business_id)) continue;
          const name = row.city_name?.trim();
          if (!name) continue;
          cityMap.set(name, (cityMap.get(name) ?? 0) + 1);
        }

        return Array.from(cityMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
      }

      // Fallback: businesses.city column
      const { data: businesses } = await supabase
        .from("businesses")
        .select("city")
        .eq("is_active", true)
        .not("city", "is", null);

      if (!businesses) return [];

      const cityMap = new Map<string, number>();
      for (const biz of businesses) {
        const name = biz.city?.trim();
        if (!name) continue;
        cityMap.set(name, (cityMap.get(name) ?? 0) + 1);
      }

      return Array.from(cityMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
