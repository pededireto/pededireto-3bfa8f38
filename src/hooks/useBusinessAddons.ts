import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BusinessAddon {
  id: string;
  business_id: string;
  addon_type: string;
  activated_at: string;
  duration_months: number;
  is_trial: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function computeExpiresAt(activatedAt: string, durationMonths: number): Date {
  const d = new Date(activatedAt);
  d.setMonth(d.getMonth() + durationMonths);
  return d;
}

export function getAddonStatus(addon: BusinessAddon | null) {
  if (!addon || !addon.is_active) return { status: "inactive" as const, daysLeft: 0, expiresAt: null };
  const expires = computeExpiresAt(addon.activated_at, addon.duration_months);
  const now = new Date();
  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { status: "expired" as const, daysLeft: 0, expiresAt: expires };
  if (daysLeft <= 7) return { status: "expiring" as const, daysLeft, expiresAt: expires };
  return { status: "active" as const, daysLeft, expiresAt: expires };
}

export const useBusinessAddon = (businessId?: string, addonType = "marketing_ai") => {
  return useQuery({
    queryKey: ["business-addon", businessId, addonType],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await (supabase as any)
        .from("business_addons")
        .select("*")
        .eq("business_id", businessId)
        .eq("addon_type", addonType)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as BusinessAddon | null;
    },
    enabled: !!businessId,
  });
};

export const useAllBusinessAddons = (addonType = "marketing_ai") => {
  return useQuery({
    queryKey: ["business-addons-all", addonType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_addons")
        .select("*, businesses:business_id(name, slug, city)")
        .eq("addon_type", addonType)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as (BusinessAddon & { businesses: { name: string; slug: string; city: string } })[];
    },
  });
};

export const useCreateAddon = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      business_id: string;
      addon_type?: string;
      activated_at: string;
      duration_months: number;
      is_trial: boolean;
    }) => {
      const { data, error } = await (supabase as any)
        .from("business_addons")
        .upsert({
          ...params,
          addon_type: params.addon_type || "marketing_ai",
          is_active: true,
          created_by: user?.id,
        }, { onConflict: "business_id,addon_type" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-addons-all"] });
      qc.invalidateQueries({ queryKey: ["business-addon"] });
    },
  });
};

export const useDeactivateAddon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_addons" as any)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-addons-all"] });
      qc.invalidateQueries({ queryKey: ["business-addon"] });
    },
  });
};
