import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessAnalyticsData {
  views: number;
  totalContacts: number;
  breakdown: {
    phone: number;
    whatsapp: number;
    website: number;
    email: number;
    instagram: number;
    facebook: number;
    reservation: number;
    order: number;
    address: number;
  };
}

export const useBusinessAnalytics = (businessId: string | null, days = 30) => {
  return useQuery({
    queryKey: ["business-analytics", businessId, days],
    enabled: !!businessId,
    queryFn: async (): Promise<BusinessAnalyticsData> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_type")
        .eq("business_id", businessId!)
        .gte("created_at", since.toISOString());

      if (error) throw error;

      const events = data || [];
      const views = events.filter((e: any) => e.event_type === "view").length;
      const phone = events.filter((e: any) => e.event_type === "click_phone").length;
      const whatsapp = events.filter((e: any) => e.event_type === "click_whatsapp").length;
      const website = events.filter((e: any) => e.event_type === "click_website").length;
      const email = events.filter((e: any) => e.event_type === "click_email").length;
      const instagram = events.filter((e: any) => e.event_type === "click_instagram").length;
      const facebook = events.filter((e: any) => e.event_type === "click_facebook").length;
      const reservation = events.filter((e: any) => e.event_type === "click_reservation").length;
      const order = events.filter((e: any) => e.event_type === "click_order").length;
      const address = events.filter((e: any) => e.event_type === "click_address").length;

      return {
        views,
        totalContacts: phone + whatsapp + website + email + instagram + facebook + reservation + order + address,
        breakdown: { phone, whatsapp, website, email, instagram, facebook, reservation, order, address },
      };
    },
  });
};
