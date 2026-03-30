import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SocialProof {
  similarRequests: number;
  avgRating: number | null;
  categoryName: string | null;
}

export const useRequestSocialProof = (
  subcategoryId: string | null | undefined,
  city: string | null | undefined
) => {
  return useQuery({
    queryKey: ["request-social-proof", subcategoryId, city],
    enabled: !!(subcategoryId || city),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Count similar requests in same city/subcategory in last 7 days
      let query = supabase
        .from("service_requests" as any)
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);
      if (city) query = query.eq("location_city", city);

      const { count: similarRequests } = await query;

      // Average rating for businesses in this subcategory
      let avgRating: number | null = null;
      if (subcategoryId) {
        const { data: businesses } = await supabase
          .from("businesses" as any)
          .select("id")
          .eq("subcategory_id", subcategoryId)
          .eq("is_verified", true)
          .limit(50);

        if (businesses && businesses.length > 0) {
          const bizIds = businesses.map((b: any) => b.id);
          const { data: reviews } = await supabase
            .from("business_reviews")
            .select("rating")
            .in("business_id", bizIds);

          if (reviews && reviews.length > 0) {
            avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          }
        }
      }

      return {
        similarRequests: similarRequests || 0,
        avgRating,
        categoryName: null,
      } as SocialProof;
    },
  });
};
