// src/hooks/useAdminUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUsers() {
  const qc = useQueryClient();

  const list = useQuery(["admin","users"], async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data;
  });

  const setRole = useMutation(async ({ userId, role }: { userId: string; role: string }) => {
    const { data, error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
    if (error) throw error;
    return data;
  }, {
    onSuccess: () => qc.invalidateQueries(["admin","users"])
  });

  return { list, setRole };
}
