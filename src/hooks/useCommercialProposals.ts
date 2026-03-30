import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CommercialProposal {
  id: string;
  business_id: string;
  commercial_id: string;
  plan_recommended: string;
  price: number;
  discount_percentage: number;
  valid_until: string;
  personal_message: string | null;
  html_content: string | null;
  email_to: string | null;
  sent_at: string | null;
  created_at: string;
}

export const useProposals = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["commercial-proposals", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("commercial_proposals" as any)
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CommercialProposal[];
    },
    enabled: !!businessId,
  });
};

export const useCreateProposal = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      business_id: string;
      plan_recommended: string;
      price: number;
      discount_percentage?: number;
      valid_until: string;
      personal_message?: string;
      html_content?: string;
      email_to?: string;
      sent_at?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("commercial_proposals" as any)
        .insert({ ...params, commercial_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CommercialProposal;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["commercial-proposals", v.business_id] });
    },
  });
};
