import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClaimRequest {
  id: string;
  name: string;
  city: string | null;
  claim_status: string | null;
  claim_requested_by: string | null;
  claim_requested_at: string | null;
  claim_review_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  requester_email?: string | null;
  requester_name?: string | null;
}

export const useClaimRequests = () => {
  return useQuery({
    queryKey: ["claim-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, city, claim_status, claim_requested_by, claim_requested_at, claim_review_notes, verified_by, verified_at")
        .in("claim_status", ["pending", "verified", "rejected", "revoked"])
        .order("claim_requested_at", { ascending: false });

      if (error) throw error;

      // Fetch requester profiles
      const userIds = [...new Set((data || []).map(b => b.claim_requested_by).filter(Boolean))];
      let profilesMap: Record<string, { email: string | null; full_name: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds as string[]);

        if (profiles) {
          for (const p of profiles) {
            profilesMap[p.id] = { email: p.email, full_name: p.full_name };
          }
        }
      }

      return (data || []).map(b => ({
        ...b,
        requester_email: b.claim_requested_by ? profilesMap[b.claim_requested_by]?.email : null,
        requester_name: b.claim_requested_by ? profilesMap[b.claim_requested_by]?.full_name : null,
      })) as ClaimRequest[];
    },
  });
};

export const usePendingClaimsCount = () => {
  return useQuery({
    queryKey: ["pending-claims-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("claim_status", "pending");

      if (error) throw error;
      return count || 0;
    },
  });
};

export const useApproveClaim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessId, notes }: { businessId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc("admin_approve_claim", {
        p_business_id: businessId,
        p_admin_notes: notes || null,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Claim aprovado com sucesso");
      qc.invalidateQueries({ queryKey: ["claim-requests"] });
      qc.invalidateQueries({ queryKey: ["pending-claims-count"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao aprovar claim"),
  });
};

export const useRejectClaim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessId, notes }: { businessId: string; notes: string }) => {
      const { data, error } = await supabase.rpc("admin_reject_claim", {
        p_business_id: businessId,
        p_admin_notes: notes,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Claim rejeitado");
      qc.invalidateQueries({ queryKey: ["claim-requests"] });
      qc.invalidateQueries({ queryKey: ["pending-claims-count"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao rejeitar claim"),
  });
};

export const useRevokeClaim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessId, notes }: { businessId: string; notes: string }) => {
      const { data, error } = await supabase.rpc("admin_revoke_claim", {
        p_business_id: businessId,
        p_admin_notes: notes,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Claim revogado");
      qc.invalidateQueries({ queryKey: ["claim-requests"] });
      qc.invalidateQueries({ queryKey: ["pending-claims-count"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao revogar claim"),
  });
};
