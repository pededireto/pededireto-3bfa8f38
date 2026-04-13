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
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase
        .from("business_notifications" as any)
        .update({ is_read: true, read_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, businessId }) => {
      await qc.cancelQueries({ queryKey: ["business-notifications"] });
      // Optimistic update on notification list
      qc.setQueriesData<BusinessNotification[]>(
        { queryKey: ["business-notifications", businessId], exact: true },
        (old) => old?.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      // Optimistic decrement of unread count
      qc.setQueryData<number>(
        ["business-notifications", businessId, "unread-count"],
        (old) => Math.max((old ?? 1) - 1, 0)
      );
    },
    onSettled: (_d, _e, { businessId }) => {
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId] });
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId, "unread-count"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const { error } = await supabase
        .from("business_notifications" as any)
        .update({ is_read: true, read_at: new Date().toISOString() } as any)
        .eq("business_id", businessId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onMutate: async (businessId) => {
      await qc.cancelQueries({ queryKey: ["business-notifications"] });
      qc.setQueriesData<BusinessNotification[]>(
        { queryKey: ["business-notifications", businessId], exact: true },
        (old) => old?.map((n) => (n.business_id === businessId ? { ...n, is_read: true } : n))
      );
      qc.setQueryData<number>(
        ["business-notifications", businessId, "unread-count"],
        () => 0
      );
    },
    onSettled: (_d, _e, businessId) => {
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId] });
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId, "unread-count"] });
    },
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId, wasUnread }: { id: string; businessId: string; wasUnread: boolean }) => {
      const { error } = await supabase
        .from("business_notifications" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, businessId, wasUnread }) => {
      await qc.cancelQueries({ queryKey: ["business-notifications"] });
      qc.setQueriesData<BusinessNotification[]>(
        { queryKey: ["business-notifications", businessId], exact: true },
        (old) => old?.filter((n) => n.id !== id)
      );
      if (wasUnread) {
        qc.setQueryData<number>(
          ["business-notifications", businessId, "unread-count"],
          (old) => Math.max((old ?? 1) - 1, 0)
        );
      }
    },
    onSettled: (_d, _e, { businessId }) => {
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId] });
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId, "unread-count"] });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const { error } = await supabase
        .from("business_notifications" as any)
        .delete()
        .eq("business_id", businessId);
      if (error) throw error;
    },
    onMutate: async (businessId) => {
      await qc.cancelQueries({ queryKey: ["business-notifications"] });
      qc.setQueriesData<BusinessNotification[]>(
        { queryKey: ["business-notifications", businessId], exact: true },
        () => []
      );
      qc.setQueryData<number>(
        ["business-notifications", businessId, "unread-count"],
        () => 0
      );
    },
    onSettled: (_d, _e, businessId) => {
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId] });
      qc.invalidateQueries({ queryKey: ["business-notifications", businessId, "unread-count"] });
    },
  });
};
