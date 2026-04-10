import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessNotification {
  id: string;
  business_id: string;
  type: "request" | "system" | "plan" | "highlight" | "badge_earned" | "lead" | "verification" | "verified";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useBusinessNotifications = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-notifications", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_notifications" as any)
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as BusinessNotification[];
    },
    enabled: !!businessId,
    refetchInterval: 30000,
  });
};

export const useUnreadNotificationsCount = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-notifications", businessId, "unread-count"],
    queryFn: async () => {
      if (!businessId) return 0;
      const { count, error } = await supabase
        .from("business_notifications" as any)
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!businessId,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });
};

export const useMarkNotificationAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_notifications" as any)
        .update({ is_read: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-notifications"] }),
    onError: (error: any) => {
      console.error("[useMarkNotificationAsRead] error:", error);
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const { error } = await supabase
        .from("business_notifications" as any)
        .update({ is_read: true } as any)
        .eq("business_id", businessId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-notifications"] }),
    onError: (error: any) => {
      console.error("[useMarkAllNotificationsAsRead] error:", error);
    },
  });
};
