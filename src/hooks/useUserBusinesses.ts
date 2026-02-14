import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserBusinesses(userId?: string) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["user", "businesses", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("business_users")
        .select("id, business_id, role, created_at, business:businesses(name,slug,city,analytics_plan,claim_status)")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const assign = useMutation({
    mutationFn: async ({ businessId, userId: uid, role }: { businessId: string; userId: string; role: string }) => {
      const { data, error } = await supabase.rpc("admin_assign_business_to_user" as any, { p_business_id: businessId, p_user_id: uid, p_role: role });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user", "businesses", userId] }),
  });

  const remove = useMutation({
    mutationFn: async ({ businessId, userId: uid }: { businessId: string; userId: string }) => {
      const { data, error } = await supabase.rpc("admin_remove_business_from_user", { p_business_id: businessId, p_user_id: uid });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user", "businesses", userId] }),
  });

  return { list, assign, remove };
}
