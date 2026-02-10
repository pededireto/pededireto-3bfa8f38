import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  target_table: string;
  target_id: string;
  target_name: string | null;
  changes: Record<string, any> | null;
  created_at: string;
}

export const useAuditLogs = (userId?: string) => {
  return useQuery({
    queryKey: ["audit-logs", userId],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });
};

export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      action: string;
      target_table: string;
      target_id: string;
      target_name?: string;
      changes?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          user_email: user.email || null,
          action: log.action,
          target_table: log.target_table,
          target_id: log.target_id,
          target_name: log.target_name || null,
          changes: log.changes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
};
