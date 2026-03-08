import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBusinessResponseTime = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-response-time", businessId],
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Get matches where this business responded
      const { data } = await supabase
        .from("request_business_matches" as any)
        .select("sent_at, first_response_at")
        .eq("business_id", businessId!)
        .not("first_response_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(20);

      if (!data || data.length === 0) return null;

      const times = (data as any[])
        .map((m) => {
          const sent = new Date(m.sent_at).getTime();
          const responded = new Date(m.first_response_at).getTime();
          return responded - sent;
        })
        .filter((t) => t > 0);

      if (times.length === 0) return null;

      const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
      const avgMinutes = Math.round(avgMs / 60000);

      return {
        avgMinutes,
        sampleSize: times.length,
        label:
          avgMinutes < 60
            ? `${avgMinutes} min`
            : avgMinutes < 1440
              ? `${Math.round(avgMinutes / 60)}h`
              : `${Math.round(avgMinutes / 1440)}d`,
      };
    },
  });
};
