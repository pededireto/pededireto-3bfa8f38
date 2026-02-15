import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCategoryBusinesses = (categoryId?: string, currentBusinessId?: string) => {
  return useQuery({
    queryKey: ["category-businesses", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .eq("category_id", categoryId)
        .order("name");

      if (error) throw error;

      // Filtrar o negócio atual
      return data?.filter(b => b.id !== currentBusinessId) || [];
    },
    enabled: !!categoryId,
  });
};

// Hook para obter negócio anterior e próximo
export const useBusinessNavigation = (categoryId?: string, currentSlug?: string) => {
  const { data: businesses = [] } = useCategoryBusinesses(categoryId);

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
  };
};
