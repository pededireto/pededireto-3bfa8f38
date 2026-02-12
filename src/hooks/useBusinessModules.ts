import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessModule {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "image" | "gallery" | "video" | "boolean" | "select";
  section: string;
  is_public_default: boolean;
  is_required: boolean;
  is_active: boolean;
  order_index: number;
  plan_restriction: string | null;
  options: any;
  created_at: string;
  updated_at: string;
}

export interface BusinessModuleValue {
  id: string;
  business_id: string;
  module_id: string;
  value: string | null;
  value_json: any;
  created_at: string;
  updated_at: string;
}

// Fetch all modules (admin)
export function useAllBusinessModules() {
  return useQuery({
    queryKey: ["business-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_modules")
        .select("*")
        .order("section")
        .order("order_index");
      if (error) throw error;
      return data as BusinessModule[];
    },
  });
}

// Fetch active modules only
export function useActiveBusinessModules() {
  return useQuery({
    queryKey: ["business-modules", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_modules")
        .select("*")
        .eq("is_active", true)
        .order("section")
        .order("order_index");
      if (error) throw error;
      return data as BusinessModule[];
    },
  });
}

// Fetch values for a specific business
export function useBusinessModuleValues(businessId: string | undefined) {
  return useQuery({
    queryKey: ["business-module-values", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_module_values")
        .select("*")
        .eq("business_id", businessId);
      if (error) throw error;
      return data as BusinessModuleValue[];
    },
    enabled: !!businessId,
  });
}

// Count values for a module (used before delete)
export function useModuleValuesCount(moduleId: string | undefined) {
  return useQuery({
    queryKey: ["business-module-values-count", moduleId],
    queryFn: async () => {
      if (!moduleId) return 0;
      const { count, error } = await supabase
        .from("business_module_values")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!moduleId,
  });
}

// Create module
export function useCreateBusinessModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (module: Omit<BusinessModule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("business_modules")
        .insert(module)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-modules"] }),
  });
}

// Update module
export function useUpdateBusinessModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BusinessModule> & { id: string }) => {
      const { data, error } = await supabase
        .from("business_modules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-modules"] }),
  });
}

// Delete module
export function useDeleteBusinessModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_modules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-modules"] }),
  });
}

// Upsert batch values for a business
export function useUpsertBusinessModuleValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessId, values }: {
      businessId: string;
      values: { module_id: string; value: string | null; value_json?: any }[];
    }) => {
      const rows = values.map((v) => ({
        business_id: businessId,
        module_id: v.module_id,
        value: v.value,
        value_json: v.value_json || null,
      }));
      const { error } = await supabase
        .from("business_module_values")
        .upsert(rows, { onConflict: "business_id,module_id" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["business-module-values", vars.businessId] });
    },
  });
}
