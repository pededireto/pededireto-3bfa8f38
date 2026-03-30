import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessCity {
  city_name: string;
  is_primary: boolean;
}

export const useBusinessCityNames = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business_cities", businessId],
    queryFn: async (): Promise<BusinessCity[]> => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_cities")
        .select("city_name, is_primary")
        .eq("business_id", businessId)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return (data || []) as BusinessCity[];
    },
    enabled: !!businessId,
  });
};

/**
 * Batch fetch cities for multiple businesses — UMA única query para toda a lista.
 * Devolve Map<business_id, BusinessCity[]>
 */
export const useBusinessCityNamesBatch = (businessIds: string[]) => {
  const ids = businessIds.filter(Boolean);
  return useQuery({
    queryKey: ["business_cities_batch", ids.slice().sort().join(",")],
    queryFn: async (): Promise<Map<string, BusinessCity[]>> => {
      if (ids.length === 0) return new Map();
      const { data, error } = await supabase
        .from("business_cities")
        .select("business_id, city_name, is_primary")
        .in("business_id", ids)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      const map = new Map<string, BusinessCity[]>();
      for (const row of (data || []) as any[]) {
        if (!map.has(row.business_id)) map.set(row.business_id, []);
        map.get(row.business_id)!.push({
          city_name: row.city_name,
          is_primary: row.is_primary,
        });
      }
      return map;
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSyncBusinessCities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      businessId,
      cities,
      primaryCity,
    }: {
      businessId: string;
      cities: string[];
      primaryCity: string;
    }) => {
      const { error: deleteError } = await supabase.from("business_cities").delete().eq("business_id", businessId);
      if (deleteError) throw deleteError;
      if (cities.length === 0) return;
      const rows = cities.map((city) => ({
        business_id: businessId,
        city_name: city.trim(),
        is_primary: city.trim() === primaryCity.trim(),
      }));
      const { error: insertError } = await supabase.from("business_cities").insert(rows);
      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["business_cities", variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ["business_cities_batch"] });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
    onError: (error: any) => {
      console.error("[useSyncBusinessCities] error:", error);
    },
  });
};

export function parseCityString(cityStr: string): string[] {
  if (!cityStr) return [];
  return cityStr
    .split(/[|,]/)
    .map((c) => c.trim())
    .filter(Boolean);
}
