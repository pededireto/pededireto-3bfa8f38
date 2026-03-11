import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAffiliateLeads = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate-leads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("affiliate_leads" as any)
        .select("*")
        .eq("affiliate_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });
};

export const useCheckLeadDuplicate = () => {
  return useMutation({
    mutationFn: async (params: { phone?: string; email?: string; website?: string }) => {
      const { data, error } = await supabase.rpc("check_affiliate_lead_duplicate", {
        p_phone: params.phone || null,
        p_email: params.email || null,
        p_website: params.website || null,
      } as any);
      if (error) throw error;
      const result = (data as any)?.[0] || { is_duplicate: false, duplicate_field: null };
      return result as { is_duplicate: boolean; duplicate_field: string | null };
    },
  });
};

export const useCreateAffiliateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      affiliate_id: string;
      business_name: string;
      contact_phone?: string;
      contact_email?: string;
      contact_website?: string;
      city?: string;
      notes?: string;
      source?: string;
    }) => {
      const { data, error } = await supabase.rpc("create_affiliate_lead", {
        p_affiliate_id: params.affiliate_id,
        p_business_name: params.business_name,
        p_contact_phone: params.contact_phone || null,
        p_contact_email: params.contact_email || null,
        p_contact_website: params.contact_website || null,
        p_city: params.city || null,
        p_notes: params.notes || null,
        p_source: params.source || "manual",
      } as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affiliate-leads"] }),
  });
};
