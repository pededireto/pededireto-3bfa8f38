import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactBreakdown {
  click_phone: number;
  click_whatsapp: number;
  click_website: number;
  click_email: number;
  click_instagram: number;
  click_facebook: number;
  click_reservation: number;
  click_order: number;
  click_address: number;
}

export interface BusinessIntelligenceData {
  impressions: number;
  clicks: number;
  ctr: number;
  searches_in_category: number;
  searches_in_city: number;
  trend: { day: string; impressions: number; clicks: number }[];
  position_average: number;
  previous: {
    impressions: number;
    clicks: number;
  };
  peak_hour: number | null;
  peak_dow: number | null;
  contacts: ContactBreakdown;
}

const DOW_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const getPeakDowLabel = (dow: number | null): string => {
  if (dow === null) return "-";
  return DOW_LABELS[dow] ?? "-";
};

export const getPeakHourLabel = (hour: number | null): string => {
  if (hour === null) return "-";
  return `${String(hour).padStart(2, "0")}h - ${String(hour + 1).padStart(2, "0")}h`;
};

export const getVariation = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const useBusinessIntelligence = (businessId: string | null | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ["intelligence", "business", businessId, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_intelligence" as any, {
        p_business_id: businessId,
        p_days: days,
      });
      if (error) throw error;

      const raw = data as any;

      // Mapear contact breakdown
      const contactsArray: { event_type: string; total: number }[] = raw?.contacts ?? [];
      const contacts: ContactBreakdown = {
        click_phone: contactsArray.find((c) => c.event_type === "click_phone")?.total ?? 0,
        click_whatsapp: contactsArray.find((c) => c.event_type === "click_whatsapp")?.total ?? 0,
        click_website: contactsArray.find((c) => c.event_type === "click_website")?.total ?? 0,
        click_email: contactsArray.find((c) => c.event_type === "click_email")?.total ?? 0,
        click_instagram: contactsArray.find((c) => c.event_type === "click_instagram")?.total ?? 0,
        click_facebook: contactsArray.find((c) => c.event_type === "click_facebook")?.total ?? 0,
        click_reservation: contactsArray.find((c) => c.event_type === "click_reservation")?.total ?? 0,
        click_order: contactsArray.find((c) => c.event_type === "click_order")?.total ?? 0,
        click_address: contactsArray.find((c) => c.event_type === "click_address")?.total ?? 0,
      };

      return {
        impressions: raw?.summary?.impressions ?? 0,
        clicks: raw?.summary?.clicks ?? 0,
        ctr: raw?.summary?.ctr ?? 0,
        position_average: raw?.summary?.avg_position ?? 0,
        searches_in_category: raw?.demand?.category_searches ?? 0,
        searches_in_city: raw?.demand?.city_searches ?? 0,
        previous: {
          impressions: raw?.previous?.impressions ?? 0,
          clicks: raw?.previous?.clicks ?? 0,
        },
        peak_hour: raw?.peak_hour ?? null,
        peak_dow: raw?.peak_dow ?? null,
        contacts,
        trend: (raw?.trend ?? []).map((t: any) => ({
          day: t.day?.split("T")[0] ?? t.day,
          impressions: t.impressions ?? 0,
          clicks: t.clicks ?? 0,
        })),
      } as BusinessIntelligenceData;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
};
