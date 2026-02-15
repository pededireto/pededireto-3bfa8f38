import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCategoryBusinesses = (
  categoryId?: string, 
  currentBusinessId?: string,
  cityFilter?: string | null
) => {
  return useQuery({
    queryKey: ["category-businesses", categoryId, cityFilter],
    queryFn: async () => {
      if (!categoryId) return [];

      let query = supabase
        .from("businesses")
        .select("id, name, slug, city")
        .eq("category_id", categoryId)
        .order("name");

      // Aplicar filtro de cidade se existir
      if (cityFilter) {
        query = query.eq("city", cityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar o negócio atual
      return data?.filter(b => b.id !== currentBusinessId) || [];
    },
    enabled: !!categoryId,
  });
};

// Hook para obter negócio anterior e próximo
export const useBusinessNavigation = (
  categoryId?: string, 
  currentSlug?: string,
  cityFilter?: string | null
) => {
  const { data: businesses = [] } = useCategoryBusinesses(categoryId, undefined, cityFilter);

  const currentIndex = businesses.findIndex(b => b.slug === currentSlug);
  
  const previousBusiness = currentIndex > 0 ? businesses[currentIndex - 1] : null;
  const nextBusiness = currentIndex < businesses.length - 1 && currentIndex !== -1 
    ? businesses[currentIndex + 1] 
    : null;

  const isLastBusiness = currentIndex === businesses.length - 1 || businesses.length === 0;

  return {
    previousBusiness,
    nextBusiness,
    isLastBusiness,
    totalBusinesses: businesses.length,
    currentPosition: currentIndex + 1,
    hasFilter: !!cityFilter,
  };
};

