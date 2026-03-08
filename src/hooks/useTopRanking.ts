import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export interface TopBusiness {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  logo_url: string | null;
  ranking_score: number;
  is_premium: boolean;
  is_featured: boolean;
  avg_rating: number;
  total_reviews: number;
}

export interface CityCount {
  city: string;
  citySlug: string;
  count: number;
}

export const useTopRanking = (subcategorySlug: string | undefined, citySlug?: string) => {
  return useQuery({
    queryKey: ["top-ranking", subcategorySlug, citySlug],
    queryFn: async () => {
      if (!subcategorySlug) return null;

      // Get subcategory by slug
      const { data: subcat, error: subErr } = await (supabase as any)
        .from("subcategories")
        .select("id, name, slug, category_id, categories(name, slug)")
        .eq("slug", subcategorySlug)
        .eq("is_active", true)
        .maybeSingle();

      if (subErr || !subcat) return null;

      // Get all business IDs in this subcategory
      const { data: links } = await (supabase as any)
        .from("business_subcategories")
        .select("business_id")
        .eq("subcategory_id", subcat.id);

      if (!links || links.length === 0) return { subcategory: subcat, businesses: [], cityCounts: [] };

      const bizIds = links.map((l: any) => l.business_id);

      // Get businesses with stats
      let query = (supabase as any)
        .from("businesses")
        .select("id, name, slug, city, logo_url, ranking_score, is_premium, is_featured, business_review_stats(average_rating, total_reviews)")
        .in("id", bizIds)
        .eq("is_active", true)
        .order("ranking_score", { ascending: false, nullsFirst: false })
        .limit(20);

      if (citySlug) {
        // Need to match city by slugified version
        // Get all businesses first, then filter
        query = query.limit(500);
      }

      const { data: rawBiz, error: bizErr } = await query;
      if (bizErr) throw bizErr;

      let businesses: TopBusiness[] = (rawBiz || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        city: b.city,
        logo_url: b.logo_url,
        ranking_score: b.ranking_score || 0,
        is_premium: b.is_premium,
        is_featured: b.is_featured,
        avg_rating: b.business_review_stats?.[0]?.average_rating || 0,
        total_reviews: b.business_review_stats?.[0]?.total_reviews || 0,
      }));

      // Build city counts from all businesses (before city filter)
      const cityMap = new Map<string, number>();
      for (const b of businesses) {
        if (b.city) {
          const key = b.city;
          cityMap.set(key, (cityMap.get(key) || 0) + 1);
        }
      }
      const cityCounts: CityCount[] = Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, citySlug: slugify(city), count }))
        .sort((a, b) => b.count - a.count);

      // Filter by city if specified
      if (citySlug) {
        businesses = businesses.filter((b) => b.city && slugify(b.city) === citySlug);
        businesses = businesses.slice(0, 20);
      }

      // Find city name from slug
      const cityName = citySlug
        ? cityCounts.find((c) => c.citySlug === citySlug)?.city || null
        : null;

      return {
        subcategory: subcat,
        businesses,
        cityCounts,
        cityName,
        totalCount: businesses.length,
      };
    },
    enabled: !!subcategorySlug,
  });
};

// Hook to check if a business is in top 10 of its primary subcategory
export const useBusinessTopPosition = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-top-position", businessId],
    queryFn: async () => {
      if (!businessId) return null;

      // Get business ranking score and city
      const { data: biz } = await (supabase as any)
        .from("businesses")
        .select("id, ranking_score, city")
        .eq("id", businessId)
        .single();

      if (!biz) return null;

      // Get primary subcategory
      const { data: subLink } = await (supabase as any)
        .from("business_subcategories")
        .select("subcategory_id, subcategories(name, slug)")
        .eq("business_id", businessId)
        .limit(1)
        .maybeSingle();

      if (!subLink?.subcategory_id) return null;

      // Count businesses ranked higher
      const { count: higherCount } = await (supabase as any)
        .from("business_subcategories")
        .select("business_id, businesses!inner(ranking_score, is_active)", { count: "exact", head: true })
        .eq("subcategory_id", subLink.subcategory_id)
        .eq("businesses.is_active", true)
        .gt("businesses.ranking_score", biz.ranking_score || 0);

      const position = (higherCount || 0) + 1;

      if (position > 10) return null;

      return {
        position,
        subcategoryName: subLink.subcategories?.name || "",
        subcategorySlug: subLink.subcategories?.slug || "",
        city: biz.city,
        citySlug: biz.city ? slugify(biz.city) : null,
      };
    },
    enabled: !!businessId,
    staleTime: 120_000,
  });
};
