import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAffiliateStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalLeads: 0, converted: 0, pendingAmount: 0, paidAmount: 0, totalCredits: 0 };

      const [leadsRes, commissionsRes, creditsRes] = await Promise.all([
        supabase.from("affiliate_leads" as any).select("status").eq("affiliate_id", user.id),
        supabase.from("affiliate_commissions" as any).select("status, commission_amount").eq("affiliate_id", user.id),
        supabase.from("affiliate_credits" as any).select("amount").eq("user_id", user.id),
      ]);

      const leads = (leadsRes.data || []) as any[];
      const commissions = (commissionsRes.data || []) as any[];
      const credits = (creditsRes.data || []) as any[];

      return {
        totalLeads: leads.length,
        converted: leads.filter((l) => l.status === "converted").length,
        pendingAmount: commissions
          .filter((c) => c.status === "pending" || c.status === "approved")
          .reduce((s: number, c: any) => s + Number(c.commission_amount), 0),
        paidAmount: commissions
          .filter((c) => c.status === "paid")
          .reduce((s: number, c: any) => s + Number(c.commission_amount), 0),
        totalCredits: credits.reduce((s: number, c: any) => s + Number(c.amount), 0),
      };
    },
    enabled: !!user?.id,
  });
};
