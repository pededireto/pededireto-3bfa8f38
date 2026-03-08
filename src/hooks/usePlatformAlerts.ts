import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface PlatformAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string | null;
  category: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string | null;
  is_read: boolean | null;
}

export const usePlatformAlerts = (filterCategory?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("platform-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_alerts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["platform-alerts"] });
          queryClient.invalidateQueries({ queryKey: ["platform-alerts-count"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_alerts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["platform-alerts"] });
          queryClient.invalidateQueries({ queryKey: ["platform-alerts-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["platform-alerts", filterCategory],
    queryFn: async () => {
      let query = (supabase as any)
        .from("admin_alerts")
        .select("*")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterCategory) {
        query = query.eq("category", filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PlatformAlert[];
    },
    enabled: !!user,
  });
};

export const usePlatformAlertsCounts = () => {
  return useQuery({
    queryKey: ["platform-alerts-count"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_alerts")
        .select("severity")
        .is("resolved_at", null);

      if (error) throw error;
      const alerts = (data || []) as { severity: string | null }[];
      return {
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        important: alerts.filter((a) => a.severity === "important").length,
        info: alerts.filter((a) => a.severity === "info").length,
      };
    },
  });
};

export const usePendingReviewsCount = () => {
  return useQuery({
    queryKey: ["pending-reviews-count"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("business_reviews")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("admin_alerts")
        .update({ resolved_at: new Date().toISOString(), resolved_by: user?.id, is_read: true })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["platform-alerts-count"] });
    },
  });
};

export const useCriticalAlertsForBell = () => {
  return useQuery({
    queryKey: ["platform-alerts-critical-bell"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_alerts")
        .select("*")
        .eq("severity", "critical")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as PlatformAlert[];
    },
  });
};
