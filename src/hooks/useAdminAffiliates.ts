import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllAffiliateLeads = () => {
  return useQuery({
    queryKey: ["admin-affiliate-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_leads" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useAllAffiliateCommissions = () => {
  return useQuery({
    queryKey: ["admin-affiliate-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useAllAffiliateCodes = () => {
  return useQuery({
    queryKey: ["admin-affiliate-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_codes" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useUpdateLeadStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("affiliate_leads" as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-affiliate-leads"] });
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
    },
  });
};

export const useApproveCommission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affiliate_commissions" as any)
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-affiliate-commissions"] }),
  });
};

export const useCancelCommission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affiliate_commissions" as any)
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-affiliate-commissions"] }),
  });
};

export const useMarkCommissionPaidAffiliate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payment_reference }: { id: string; payment_reference?: string }) => {
      const { error } = await supabase
        .from("affiliate_commissions" as any)
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_reference: payment_reference || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-affiliate-commissions"] }),
  });
};

export const usePayWithCredits = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commissionId, affiliateId, amount }: { commissionId: string; affiliateId: string; amount: number }) => {
      // Add credits
      const { error: creditErr } = await supabase
        .from("affiliate_credits" as any)
        .insert({
          user_id: affiliateId,
          amount,
          description: "Comissão de afiliado convertida em créditos",
          commission_id: commissionId,
        });
      if (creditErr) throw creditErr;

      // Mark commission as paid
      const { error: commErr } = await supabase
        .from("affiliate_commissions" as any)
        .update({
          status: "paid",
          payment_method: "platform_credits",
          paid_at: new Date().toISOString(),
        })
        .eq("id", commissionId);
      if (commErr) throw commErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-affiliate-commissions"] });
      qc.invalidateQueries({ queryKey: ["affiliate-credits"] });
      qc.invalidateQueries({ queryKey: ["affiliate-commissions"] });
    },
  });
};
