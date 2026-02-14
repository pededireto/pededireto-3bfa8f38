// src/hooks/useUserBusinesses.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserBusinesses(userId?: string) {
  const qc = useQueryClient();

  const query = useQuery(["user","businesses", userId], async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("business_users")
      .select("id, business_id, role, created_at, business:businesses(name,slug,city,analytics_plan,claim_status))")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  }, { enabled: !!userId });

  const assign = useMutation(async ({ businessId, userId, role }: { businessId:string, userId:string, role:string }) => {
    const { data, error } = await supabase.rpc("admin_assign_business_to_user", { p_business_id: businessId, p_user_id: userId, p_role: role });
    if (error) throw error;
    return data;
  }, { onSuccess: () => qc.invalidateQueries(["user","businesses", userId]) });

  const remove = useMutation(async ({ businessId, userId }: { businessId:string, userId:string }) => {
    const { data, error } = await supabase.rpc("admin_remove_business_from_user", { p_business_id: businessId, p_user_id: userId });
    if (error) throw error;
    return data;
  }, { onSuccess: () => qc.invalidateQueries(["user","businesses", userId]) });

  return { query, assign, remove };
}
