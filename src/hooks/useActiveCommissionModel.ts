import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useActiveCommissionModel = () => {
  return useQuery({
    queryKey: ["active-commission-model"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_models" as any)
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
  });
};
