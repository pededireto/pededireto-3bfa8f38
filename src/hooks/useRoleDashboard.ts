import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminDashboardKPIs = () => {
  return useQuery({
    queryKey: ["admin-dashboard-kpis"],
    queryFn: async () => {
      const [commRes, revRes] = await Promise.all([
        supabase.from("commercial_commissions" as any).select("amount, status, adjustment_type"),
        supabase.from("revenue_events" as any).select("amount, event_type"),
      ]);

      const commissions = (commRes.data || []) as any[];
      const events = (revRes.data || []) as any[];

      const totalRevenue = events.reduce((s: number, e: any) => s + Number(e.amount), 0);
      const commGenerated = commissions.filter((c: any) => !c.adjustment_type).reduce((s: number, c: any) => s + Number(c.amount), 0);
      const commValidated = commissions.filter((c: any) => c.status === "validated" && !c.adjustment_type).reduce((s: number, c: any) => s + Number(c.amount), 0);
      const commPaid = commissions.filter((c: any) => c.status === "paid" && !c.adjustment_type).reduce((s: number, c: any) => s + Number(c.amount), 0);
      const reversals = commissions.filter((c: any) => c.adjustment_type === "reversal").reduce((s: number, c: any) => s + Math.abs(Number(c.amount)), 0);
      const netRevenue = totalRevenue - reversals;

      return { totalRevenue, commGenerated, commValidated, commPaid, reversals, netRevenue };
    },
  });
};

export const useCsDashboardKPIs = () => {
  return useQuery({
    queryKey: ["cs-dashboard-kpis"],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("revenue_events" as any)
        .select("amount, event_type")
        .in("event_type", ["churn_recovery", "reactivation"]);

      const items = (events || []) as any[];
      const churnRecovered = items.filter((e: any) => e.event_type === "churn_recovery").length;
      const revenueRecovered = items.reduce((s: number, e: any) => s + Number(e.amount), 0);
      const reactivated = items.filter((e: any) => e.event_type === "reactivation").length;

      return { churnRecovered, revenueRecovered, reactivated };
    },
  });
};

export const useOnboardingDashboardKPIs = () => {
  return useQuery({
    queryKey: ["onboarding-dashboard-kpis"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, activated_at, subscription_status")
        .eq("subscription_status", "active")
        .not("activated_at", "is", null);

      const items = (businesses || []) as any[];
      const total = items.length;
      const recent = items.filter((b: any) => b.activated_at >= thirtyDaysAgo).length;

      return { totalActivations: total, recentActivations: recent };
    },
  });
};

export const useLeadsDashboardKPIs = () => {
  return useQuery({
    queryKey: ["leads-dashboard-kpis"],
    queryFn: async () => {
      const [reqRes, matchRes] = await Promise.all([
        supabase.from("service_requests" as any).select("id, status, category_id, location_city, created_at"),
        supabase.from("request_business_matches" as any).select("id, status, responded_at"),
      ]);

      const requests = (reqRes.data || []) as any[];
      const matches = (matchRes.data || []) as any[];

      const totalRequests = requests.length;
      const totalMatches = matches.length;
      const responded = matches.filter((m: any) => m.status === "respondido" || m.responded_at).length;
      const responseRate = totalMatches > 0 ? ((responded / totalMatches) * 100).toFixed(1) : "0";

      // By category
      const byCategory: Record<string, number> = {};
      requests.forEach((r: any) => {
        if (r.category_id) byCategory[r.category_id] = (byCategory[r.category_id] || 0) + 1;
      });

      // By city
      const byCity: Record<string, number> = {};
      requests.forEach((r: any) => {
        const city = r.location_city || "Sem cidade";
        byCity[city] = (byCity[city] || 0) + 1;
      });

      // Monthly trend (last 6 months)
      const monthly: Record<string, number> = {};
      requests.forEach((r: any) => {
        const month = r.created_at?.substring(0, 7);
        if (month) monthly[month] = (monthly[month] || 0) + 1;
      });

      return {
        totalRequests,
        totalMatches,
        responded,
        responseRate,
        byCategory,
        byCity,
        monthly: Object.entries(monthly).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month)),
      };
    },
  });
};
