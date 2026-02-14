import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInternalNotifications = (targetRole: string | undefined) => {
  return useQuery({
    queryKey: ["internal-notifications", targetRole],
    queryFn: async () => {
      if (!targetRole) return [];
      const { data, error } = await supabase
        .from("internal_notifications")
        .select("*")
        .eq("target_role", targetRole)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!targetRole,
  });
};

export const useUnreadInternalCount = (targetRole: string | undefined) => {
  return useQuery({
    queryKey: ["internal-notifications-unread", targetRole],
    queryFn: async () => {
      if (!targetRole) return 0;
      const { count, error } = await supabase
        .from("internal_notifications")
        .select("*", { count: "exact", head: true })
        .eq("target_role", targetRole)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!targetRole,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("internal_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["internal-notifications-unread"] });
    },
  });
};
