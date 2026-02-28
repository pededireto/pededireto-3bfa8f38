import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EventType = "view" | "click_whatsapp" | "click_phone" | "click_website" | "click_email" | "click_app";

export type PeriodFilter = "7d" | "30d" | "90d" | "all";

interface AnalyticsEvent {
  event_type: EventType;
  business_id?: string;
  category_id?: string;
  city?: string;
}

export interface AnalyticsFilters {
  period: PeriodFilter;
  categoryId?: string | null;
  subcategoryId?: string | null;
  city?: string | null;
}

// Google Analytics helper with safe fallback
export const trackGtagEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, params || {});
  }
};

const getPeriodDate = (period: PeriodFilter): string | null => {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const useTrackEvent = () => {
  return useMutation({
    mutationFn: async (event: AnalyticsEvent) => {
      const { error } = await supabase.from("analytics_events").insert(event);
      if (error) throw error;
      trackGtagEvent(event.event_type, {
        business_id: event.business_id,
        category_id: event.category_id,
        city: event.city,
      });
    },
  });
};

export const useAnalyticsSummary = (filters: AnalyticsFilters = { period: "30d" }) => {
  return useQuery({
    queryKey: ["analytics", "summary", filters],
    queryFn: async () => {
      const since = getPeriodDate(filters.period);

      const buildBase = (query: any) => {
        if (since) query = query.gte("created_at", since);
        if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
        if (filters.city) query = query.ilike("city", `%${filters.city}%`);
        return query;
      };

      // Total views
      let viewsQuery = supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "view");
      viewsQuery = buildBase(viewsQuery);
      const { count: totalViews } = await viewsQuery;

      // Total clicks
      let clicksQuery = supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .in("event_type", ["click_whatsapp", "click_phone", "click_website", "click_email", "click_app"]);
      clicksQuery = buildBase(clicksQuery);
      const { count: totalClicks } = await clicksQuery;

      // Clicks by type
      let clicksByTypeQuery = supabase
        .from("analytics_events")
        .select("event_type")
        .in("event_type", ["click_whatsapp", "click_phone", "click_website", "click_email", "click_app"]);
      clicksByTypeQuery = buildBase(clicksByTypeQuery);
      const { data: clicksByType } = await clicksByTypeQuery;

      const clicksBreakdown = {
        whatsapp: clicksByType?.filter((e) => e.event_type === "click_whatsapp").length || 0,
        phone: clicksByType?.filter((e) => e.event_type === "click_phone").length || 0,
        website: clicksByType?.filter((e) => e.event_type === "click_website").length || 0,
        email: clicksByType?.filter((e) => e.event_type === "click_email").length || 0,
        app: clicksByType?.filter((e) => e.event_type === "click_app").length || 0,
      };

      // Top categories
      let catQuery = supabase
        .from("analytics_events")
        .select("category_id, categories (name, id)")
        .not("category_id", "is", null);
      if (since) catQuery = catQuery.gte("created_at", since);
      if (filters.city) catQuery = catQuery.ilike("city", `%${filters.city}%`);
      const { data: categoryEvents } = await catQuery.limit(2000);

      const categoryCounts: Record<string, { name: string; count: number; id: string }> = {};
      categoryEvents?.forEach((event) => {
        if (event.category_id && event.categories) {
          const cat = event.categories as { name: string; id: string };
          if (!categoryCounts[event.category_id]) {
            categoryCounts[event.category_id] = { name: cat.name, count: 0, id: event.category_id };
          }
          categoryCounts[event.category_id].count++;
        }
      });

      const topCategories = Object.values(categoryCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top businesses
      let bizQuery = supabase
        .from("analytics_events")
        .select("business_id, businesses (name, city, category_id)")
        .not("business_id", "is", null);
      bizQuery = buildBase(bizQuery);
      if (filters.subcategoryId) {
        // filter by subcategory via businesses join — fetch all and filter client-side
      }
      const { data: businessEvents } = await bizQuery.limit(2000);

      const businessCounts: Record<string, { name: string; count: number; city: string }> = {};
      businessEvents?.forEach((event) => {
        if (event.business_id && event.businesses) {
          const biz = event.businesses as { name: string; city: string; category_id: string };
          if (!businessCounts[event.business_id]) {
            businessCounts[event.business_id] = { name: biz.name, count: 0, city: biz.city };
          }
          businessCounts[event.business_id].count++;
        }
      });

      const topBusinesses = Object.values(businessCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalViews: totalViews || 0,
        totalClicks: totalClicks || 0,
        clicksBreakdown,
        topCategories,
        topBusinesses,
      };
    },
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ["analytics", "user-stats"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("created_at, last_activity_at");
      if (error) throw error;

      const all = profiles || [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return {
        total: all.length,
        newThisMonth: all.filter((p) => p.created_at >= startOfMonth).length,
        activeLast30: all.filter((p) => p.last_activity_at && p.last_activity_at >= thirtyDaysAgo.toISOString()).length,
      };
    },
  });
};

// Hook para cidades únicas nos eventos (para o filtro de cidade)
export const useAnalyticsCities = () => {
  return useQuery({
    queryKey: ["analytics", "cities"],
    queryFn: async () => {
      const { data } = await supabase.from("analytics_events").select("city").not("city", "is", null).limit(1000);

      const cities = [...new Set((data || []).map((e) => e.city).filter(Boolean))].sort();
      return cities as string[];
    },
  });
};
