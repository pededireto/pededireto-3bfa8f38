import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useBusinessMembership = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["business-membership", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("business_users")
        .select("business_id, role, businesses(id, name, slug)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

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
