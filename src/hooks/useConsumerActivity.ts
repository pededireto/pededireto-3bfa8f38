import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  icon: string;
  entity_id: string | null;
  entity_type: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const useConsumerActivity = (userId: string | undefined, limit = 20) => {
  return useQuery({
    queryKey: ["consumer-activity", userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("consumer_activity_log")
        .select("id, event_type, title, description, icon, entity_id, entity_type, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as ActivityEvent[];
    },
    staleTime: 30_000,
  });
};
