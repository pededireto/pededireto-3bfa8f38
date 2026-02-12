import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRevenueKPIs = () => {
  return useQuery({
    queryKey: ["revenue-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("subscription_price")
        .eq("subscription_status", "active");

      if (error) throw error;

      const activeBusinesses = data?.length ?? 0;
      const mrr = data?.reduce((sum, b) => sum + (Number(b.subscription_price) || 0), 0) ?? 0;
      const arpu = activeBusinesses > 0 ? mrr / activeBusinesses : 0;
      const arr = mrr * 12;

      return { mrr, activeBusinesses, arpu, arr };
    },
  });
};

export const useRevenueByPlan = () => {
  return useQuery({
    queryKey: ["revenue-by-plan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("subscription_price, plan_id, commercial_plans(name)")
        .eq("subscription_status", "active")
        .not("plan_id", "is", null);

      if (error) throw error;

      const planMap: Record<string, { name: string; total: number; mrr: number }> = {};

      for (const b of data ?? []) {
        const planName = (b.commercial_plans as any)?.name || "Sem plano";
        const planId = b.plan_id || "unknown";
        if (!planMap[planId]) {
          planMap[planId] = { name: planName, total: 0, mrr: 0 };
        }
        planMap[planId].total += 1;
        planMap[planId].mrr += Number(b.subscription_price) || 0;
      }

      const totalMrr = Object.values(planMap).reduce((s, p) => s + p.mrr, 0);

      return Object.values(planMap)
        .map((p) => ({
          ...p,
          percentage: totalMrr > 0 ? (p.mrr / totalMrr) * 100 : 0,
        }))
        .sort((a, b) => b.mrr - a.mrr);
    },
  });
};

export const useRevenueGrowth = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["revenue-growth", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("subscription_start_date, subscription_price")
        .eq("subscription_status", "active")
        .gte("subscription_start_date", startDate)
        .lte("subscription_start_date", endDate);

      if (error) throw error;

      const monthMap: Record<string, number> = {};
      for (const b of data ?? []) {
        if (!b.subscription_start_date) continue;
        const month = b.subscription_start_date.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + (Number(b.subscription_price) || 0);
      }

      return Object.entries(monthMap)
        .map(([month, mrr]) => ({ month, mrr }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!startDate && !!endDate,
  });
};

export const useSubscriptionFlow = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["subscription-flow", startDate, endDate],
    queryFn: async () => {
      // New subscriptions
      const { data: newSubs, error: e1 } = await supabase
        .from("businesses")
        .select("subscription_start_date")
        .eq("subscription_status", "active")
        .gte("subscription_start_date", startDate)
        .lte("subscription_start_date", endDate);

      if (e1) throw e1;

      // Cancellations
      const { data: cancels, error: e2 } = await supabase
        .from("businesses")
        .select("subscription_end_date")
        .in("subscription_status", ["inactive", "expired"])
        .not("subscription_end_date", "is", null)
        .gte("subscription_end_date", startDate)
        .lte("subscription_end_date", endDate);

      if (e2) throw e2;

      const newMap: Record<string, number> = {};
      for (const b of newSubs ?? []) {
        if (!b.subscription_start_date) continue;
        const m = b.subscription_start_date.substring(0, 7);
        newMap[m] = (newMap[m] || 0) + 1;
      }

      const cancelMap: Record<string, number> = {};
      for (const b of cancels ?? []) {
        if (!b.subscription_end_date) continue;
        const m = b.subscription_end_date.substring(0, 7);
        cancelMap[m] = (cancelMap[m] || 0) + 1;
      }

      const allMonths = new Set([...Object.keys(newMap), ...Object.keys(cancelMap)]);
      return Array.from(allMonths)
        .sort()
        .map((month) => ({
          month,
          new_subscriptions: newMap[month] || 0,
          cancellations: cancelMap[month] || 0,
        }));
    },
    enabled: !!startDate && !!endDate,
  });
};
