import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EventType = 
  | "view" 
  | "click_whatsapp" 
  | "click_phone" 
  | "click_website" 
  | "click_email"
  | "click_app";

interface AnalyticsEvent {
  event_type: EventType;
  business_id?: string;
  category_id?: string;
  city?: string;
}

export const useTrackEvent = () => {
  return useMutation({
    mutationFn: async (event: AnalyticsEvent) => {
      const { error } = await supabase
        .from("analytics_events")
        .insert(event);
      
      if (error) throw error;
    },
  });
};

export const useAnalyticsSummary = () => {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      // Get total views
      const { count: totalViews } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "view");

      // Get total clicks
      const { count: totalClicks } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .in("event_type", ["click_whatsapp", "click_phone", "click_website", "click_email", "click_app"]);

      // Get clicks by type
      const { data: clicksByType } = await supabase
        .from("analytics_events")
        .select("event_type")
        .in("event_type", ["click_whatsapp", "click_phone", "click_website", "click_email", "click_app"]);

      const clicksBreakdown = {
        whatsapp: clicksByType?.filter(e => e.event_type === "click_whatsapp").length || 0,
        phone: clicksByType?.filter(e => e.event_type === "click_phone").length || 0,
        website: clicksByType?.filter(e => e.event_type === "click_website").length || 0,
        email: clicksByType?.filter(e => e.event_type === "click_email").length || 0,
        app: clicksByType?.filter(e => e.event_type === "click_app").length || 0,
      };

      // Get top categories
      const { data: categoryEvents } = await supabase
        .from("analytics_events")
        .select(`
          category_id,
          categories (
            name
          )
        `)
        .not("category_id", "is", null)
        .limit(1000);

      const categoryCounts: Record<string, { name: string; count: number }> = {};
      categoryEvents?.forEach(event => {
        if (event.category_id && event.categories) {
          const catName = (event.categories as { name: string }).name;
          if (!categoryCounts[event.category_id]) {
            categoryCounts[event.category_id] = { name: catName, count: 0 };
          }
          categoryCounts[event.category_id].count++;
        }
      });

      const topCategories = Object.values(categoryCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get top businesses
      const { data: businessEvents } = await supabase
        .from("analytics_events")
        .select(`
          business_id,
          businesses (
            name
          )
        `)
        .not("business_id", "is", null)
        .limit(1000);

      const businessCounts: Record<string, { name: string; count: number }> = {};
      businessEvents?.forEach(event => {
        if (event.business_id && event.businesses) {
          const bizName = (event.businesses as { name: string }).name;
          if (!businessCounts[event.business_id]) {
            businessCounts[event.business_id] = { name: bizName, count: 0 };
          }
          businessCounts[event.business_id].count++;
        }
      });

      const topBusinesses = Object.values(businessCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

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
