import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommercialPlan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  is_active: boolean;
  premium_level: "SUPER" | "CATEGORIA" | "SUBCATEGORIA" | null;
  description: string | null;
  display_order: number;
  plan_type: "business" | "consumer";
  payment_method: "sepa" | "mbway" | "free" | null; // ← NOVO
  stripe_price_id: string | null; // ← NOVO
  stripe_product_id: string | null; // ← NOVO
  created_at: string;
  updated_at: string;
}

export const useCommercialPlans = (activeOnly = false) => {
  return useQuery({
    queryKey: ["commercial-plans", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("commercial_plans" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as CommercialPlan[];
    },
  });
};

export const useCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<CommercialPlan, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("commercial_plans" as any)
        .insert(plan as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commercial-plans"] }),
  });
};

export const useUpdatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommercialPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from("commercial_plans" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commercial-plans"] }),
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commercial_plans" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commercial-plans"] }),
  });
};
