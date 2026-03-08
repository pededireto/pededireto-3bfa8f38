import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, subWeeks, format, eachDayOfInterval, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

export interface DailyInsight {
  day: string;       // "seg", "ter", etc.
  date: string;      // ISO date
  requests: number;
  responses: number;
  reviews: number;
  favorites: number;
}

export interface WeeklySummary {
  totalRequests: number;
  totalResponses: number;
  totalReviews: number;
  totalFavorites: number;
  requestsDelta: number;   // vs previous week
  responsesDelta: number;
  dailyData: DailyInsight[];
}

async function fetchWeekData(userId: string, weekStart: Date, weekEnd: Date) {
  const from = weekStart.toISOString();
  const to = weekEnd.toISOString();

  const [requestsRes, responsesRes, reviewsRes, favoritesRes] = await Promise.all([
    (supabase as any)
      .from("service_requests")
      .select("id, created_at")
      .eq("user_id", userId)
      .gte("created_at", from)
      .lte("created_at", to),
    (supabase as any)
      .from("service_request_matches")
      .select("id, created_at, service_requests!inner(user_id)")
      .eq("service_requests.user_id", userId)
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("business_reviews")
      .select("id, created_at")
      .eq("user_id", userId)
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("user_favorites")
      .select("id, created_at")
      .eq("user_id", userId)
      .gte("created_at", from)
      .lte("created_at", to),
  ]);

  return {
    requests: requestsRes.data ?? [],
    responses: responsesRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    favorites: favoritesRes.data ?? [],
  };
}

function countByDay(items: { created_at: string }[], date: string): number {
  return items.filter((i) => i.created_at?.startsWith(date)).length;
}

export const useConsumerInsights = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["consumer-insights", userId],
    enabled: !!userId,
    queryFn: async (): Promise<WeeklySummary> => {
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const prevWeekStart = subWeeks(thisWeekStart, 1);
      const prevWeekEnd = subWeeks(thisWeekEnd, 1);

      const [current, previous] = await Promise.all([
        fetchWeekData(userId!, thisWeekStart, thisWeekEnd),
        fetchWeekData(userId!, prevWeekStart, prevWeekEnd),
      ]);

      const days = eachDayOfInterval({ start: thisWeekStart, end: thisWeekEnd });

      const dailyData: DailyInsight[] = days.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        return {
          day: format(d, "EEE", { locale: pt }),
          date: dateStr,
          requests: countByDay(current.requests, dateStr),
          responses: countByDay(current.responses, dateStr),
          reviews: countByDay(current.reviews, dateStr),
          favorites: countByDay(current.favorites, dateStr),
        };
      });

      const totalRequests = current.requests.length;
      const totalResponses = current.responses.length;
      const totalReviews = current.reviews.length;
      const totalFavorites = current.favorites.length;

      return {
        totalRequests,
        totalResponses,
        totalReviews,
        totalFavorites,
        requestsDelta: totalRequests - previous.requests.length,
        responsesDelta: totalResponses - previous.responses.length,
        dailyData,
      };
    },
    staleTime: 5 * 60_000,
  });
};
