import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useClaimBusiness = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      business_id: string;
      claimed_for_name: string;
      claimed_for_email: string;
      claimed_for_phone?: string;
      offered_plan?: string;
      trial_months?: number;
      notes?: string;
    }) => {
      const { error } = await (supabase as any).from("business_claim_history").insert({
        ...input,
        processed_by: user?.id,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-claims"] });
    },
  });
};

export const usePendingClaims = () => {
  return useQuery({
    queryKey: ["pending-claims"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_claim_history")
        .select("*, businesses(name, city, slug)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useApproveClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ claimId, businessId }: { claimId: string; businessId: string }) => {
      const { error: claimError } = await (supabase as any)
        .from("business_claim_history")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", claimId);
      if (claimError) throw claimError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-claims"] });
    },
  });
};

export const useRejectClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason?: string }) => {
      const { error } = await (supabase as any)
        .from("business_claim_history")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-claims"] });
    },
  });
};
