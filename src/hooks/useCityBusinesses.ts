import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SmartBusiness } from "@/hooks/useSmartSearch";

const PAGE_SIZE = 12;

const BIZ_SELECT =
  "id, name, slug, city, logo_url, ranking_score, subscription_plan, is_premium, is_featured, categories(name, slug), subcategories(name, slug)";

function formatBusiness(b: any): SmartBusiness {
  const cat = Array.isArray(b.categories) ? b.categories[0] : b.categories;
  const sub = Array.isArray(b.subcategories) ? b.subcategories[0] : b.subcategories;
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    city: b.city,
    logo_url: b.logo_url,
    ranking_score: b.ranking_score,
    subscription_plan: b.subscription_plan,
    is_premium: b.is_premium,
    category_name: cat?.name ?? null,
    category_slug: cat?.slug ?? null,
    subcategory_name: sub?.name ?? null,
  };
}

/**
 * Fetches all active businesses for a given city, with pagination.
 * Only used when there's a city filter but NO search term.
 */
export const useCityBusinesses = (city: string, page: number = 1) => {
  return useQuery({
    queryKey: ["city-businesses", city.toLowerCase(), page],
    queryFn: async () => {
      // First get total count
      const { count } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .ilike("city", `%${city}%`);

      // Also count from business_cities junction
      const { data: junctionIds } = await supabase
        .from("business_cities")
        .select("business_id")
        .ilike("city_name", `%${city}%`);

      const junctionBusinessIds = (junctionIds ?? []).map((j) => j.business_id);

      // Fetch paginated results from businesses table
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: directBiz } = await supabase
        .from("businesses")
        .select(BIZ_SELECT)
        .eq("is_active", true)
        .ilike("city", `%${city}%`)
        .order("is_featured", { ascending: false })
        .order("is_premium", { ascending: false })
        .order("ranking_score", { ascending: false, nullsFirst: false })
        .order("display_order", { ascending: true })
        .range(from, to);

      // Also fetch from junction table (businesses not caught by direct city match)
      let junctionBiz: any[] = [];
      if (junctionBusinessIds.length > 0) {
        const directIds = new Set((directBiz ?? []).map((b) => b.id));
        const extraIds = junctionBusinessIds.filter((id) => !directIds.has(id));
        if (extraIds.length > 0) {
          const { data } = await supabase
            .from("businesses")
            .select(BIZ_SELECT)
            .eq("is_active", true)
            .in("id", extraIds)
            .order("is_featured", { ascending: false })
            .order("is_premium", { ascending: false })
            .order("ranking_score", { ascending: false, nullsFirst: false })
            .limit(PAGE_SIZE);
          junctionBiz = data ?? [];
        }
      }

      // Merge and deduplicate
      const seen = new Set<string>();
      const allBiz: SmartBusiness[] = [];
      for (const b of [...(directBiz ?? []), ...junctionBiz]) {
        if (seen.has(b.id)) continue;
        seen.add(b.id);
        allBiz.push(formatBusiness(b));
      }

      const totalCount = Math.max(count ?? 0, junctionBusinessIds.length);

      return {
        businesses: allBiz.slice(0, PAGE_SIZE),
        totalCount,
        hasMore: from + PAGE_SIZE < totalCount,
      };
    },
    enabled: city.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};
