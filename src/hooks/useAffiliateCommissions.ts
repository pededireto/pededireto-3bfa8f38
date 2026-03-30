import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAffiliateCommissions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate-commissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("affiliate_commissions" as any)
        .select("*")
        .eq("affiliate_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });
};

export const useAffiliateCredits = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate-credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, entries: [] };
      const { data, error } = await supabase
        .from("affiliate_credits" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const entries = data as any[];
      const total = entries.reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { total, entries };
    },
    enabled: !!user?.id,
  });
};
