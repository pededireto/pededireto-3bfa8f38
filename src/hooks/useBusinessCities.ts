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
      // 1. Delete existing
      const { error: deleteError } = await supabase
        .from("business_cities")
        .delete()
        .eq("business_id", businessId);

      if (deleteError) throw deleteError;

      // 2. Insert new
      if (cities.length === 0) return;

      const rows = cities.map((city) => ({
        business_id: businessId,
        city_name: city.trim(),
        is_primary: city.trim() === primaryCity.trim(),
      }));

      const { error: insertError } = await supabase
        .from("business_cities")
        .insert(rows);

      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business_cities", variables.businessId],
      });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
  });
};

/**
 * Parse a city string that may contain separators (| or ,) into an array of trimmed city names
 */
export function parseCityString(cityStr: string): string[] {
  if (!cityStr) return [];
  return cityStr
    .split(/[|,]/)
    .map((c) => c.trim())
    .filter(Boolean);
}
