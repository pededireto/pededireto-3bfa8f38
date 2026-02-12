import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  request_count?: number;
}

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as UserProfile[];
    },
  });
};

export const useUserRequestCounts = () => {
  return useQuery({
    queryKey: ["user-request-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select("user_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      });
      return counts;
    },
  });
};

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};
