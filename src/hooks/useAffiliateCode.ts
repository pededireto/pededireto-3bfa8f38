import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAffiliateCode = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate-code", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc("generate_affiliate_code", {
        p_user_id: user.id,
      } as any);
      if (error) throw error;
      return data as string;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });
};
