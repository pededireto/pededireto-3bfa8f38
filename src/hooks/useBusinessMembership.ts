import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// FIX: em vez de .eq("user_id", user.id) que falha para utilizadores
// onde profiles.id != auth.uid(), usamos uma RPC que resolve
// o profiles.id correto internamente.
export const useBusinessMembership = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["business-membership", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase as any).rpc("get_user_business_membership");

      if (error) {
        console.error("useBusinessMembership error:", error.message);
        return null;
      }

      return data as {
        business_id: string;
        role: string;
        business: { id: string; name: string; slug: string } | null;
      } | null;
    },
    enabled: !!user?.id,
  });
};

// SEM ALTERAÇÕES
export const useBusinessTeam = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-team", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_users")
        .select("id, user_id, role, created_at, profiles(full_name, email)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!businessId,
  });
};
