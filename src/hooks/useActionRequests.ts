import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActionRequest {
  id: string;
  requested_by: string;
  action_type: string;
  target_table: string;
  target_id: string;
  target_name: string | null;
  details: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export const useActionRequests = (status?: string) => {
  return useQuery({
    queryKey: ["action-requests", status],
    queryFn: async () => {
      let query = supabase
        .from("admin_action_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;
      return data as ActionRequest[];
    },
  });
};

export const useCreateActionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      action_type: string;
      target_table: string;
      target_id: string;
      target_name?: string;
      details?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("admin_action_requests")
        .insert({
          requested_by: user.id,
          action_type: request.action_type,
          target_table: request.target_table,
          target_id: request.target_id,
          target_name: request.target_name || null,
          details: request.details || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-requests"] });
    },
  });
};

export const useReviewActionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, review_note }: { id: string; status: "approved" | "rejected"; review_note?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("admin_action_requests")
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_note: review_note || null,
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-requests"] });
    },
  });
};

export const usePendingRequestsCount = () => {
  return useQuery({
    queryKey: ["action-requests", "pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("admin_action_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
  });
};
