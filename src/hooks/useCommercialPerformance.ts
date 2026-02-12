import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Assignments ───

export const useCommercialAssignments = (businessId?: string) => {
  return useQuery({
    queryKey: ["commercial-assignments", businessId],
    queryFn: async () => {
      let query = supabase
        .from("business_commercial_assignments" as any)
        .select("*, profiles!business_commercial_assignments_commercial_id_fkey(user_id, full_name, email)")
        .order("assigned_at", { ascending: false });

      if (businessId) query = query.eq("business_id", businessId);

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: businessId ? !!businessId : true,
  });
};

export const useMyAssignments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-commercial-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("business_commercial_assignments" as any)
        .select("*, businesses(id, name, slug, subscription_status, subscription_price, plan_id, commercial_plans(name))")
        .eq("commercial_id", user.id)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { business_id: string; commercial_id: string; role: string }) => {
      const { error } = await supabase
        .from("business_commercial_assignments" as any)
        .insert(params);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commercial-assignments"] }),
  });
};

export const useDeactivateAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_commercial_assignments" as any)
        .update({ is_active: false, unassigned_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commercial-assignments"] }),
  });
};

export const useTransferToAccountManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { business_id: string; commercial_id: string }) => {
      // Deactivate existing sales assignment
      await supabase
        .from("business_commercial_assignments" as any)
        .update({ is_active: false, unassigned_at: new Date().toISOString() })
        .eq("business_id", params.business_id)
        .eq("role", "sales")
        .eq("is_active", true);

      // Create account_manager assignment
      const { error } = await supabase
        .from("business_commercial_assignments" as any)
        .insert({
          business_id: params.business_id,
          commercial_id: params.commercial_id,
          role: "account_manager",
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commercial-assignments"] }),
  });
};

// ─── Commission Models ───

export interface CommissionModel {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCommissionModels = () => {
  return useQuery({
    queryKey: ["commission-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_models" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CommissionModel[];
    },
  });
};

export const useCreateCommissionModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from("commission_models" as any)
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-models"] }),
  });
};

export const useActivateCommissionModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (modelId: string) => {
      // Deactivate all first
      await supabase
        .from("commission_models" as any)
        .update({ is_active: false })
        .neq("id", modelId);

      const { error } = await supabase
        .from("commission_models" as any)
        .update({ is_active: true })
        .eq("id", modelId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-models"] }),
  });
};

export const useDeleteCommissionModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_models" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-models"] }),
  });
};

// ─── Commission Rules ───

export interface CommissionRule {
  id: string;
  commission_model_id: string;
  plan_id: string | null;
  commission_type: "percentage" | "fixed";
  value: number;
  applies_to: "first_payment" | "monthly";
  duration_months: number | null;
  created_at: string;
}

export const useCommissionRules = (modelId?: string) => {
  return useQuery({
    queryKey: ["commission-rules", modelId],
    queryFn: async () => {
      let query = supabase
        .from("commission_rules" as any)
        .select("*, commercial_plans(name)")
        .order("created_at", { ascending: true });
      if (modelId) query = query.eq("commission_model_id", modelId);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: modelId ? !!modelId : true,
  });
};

export const useCreateCommissionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: Omit<CommissionRule, "id" | "created_at">) => {
      const { error } = await supabase
        .from("commission_rules" as any)
        .insert(params);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-rules"] }),
  });
};

export const useDeleteCommissionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_rules" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-rules"] }),
  });
};

// ─── Commissions ───

export interface CommercialCommission {
  id: string;
  commercial_id: string;
  business_id: string;
  commission_model_id: string;
  reference_month: string;
  amount: number;
  status: "generated" | "validated" | "paid" | "reversed" | "cancelled";
  created_at: string;
  paid_at: string | null;
  adjustment_type: string | null;
  original_commission_id: string | null;
}

export const useCommercialCommissions = (commercialId?: string) => {
  return useQuery({
    queryKey: ["commercial-commissions", commercialId],
    queryFn: async () => {
      let query = supabase
        .from("commercial_commissions" as any)
        .select("*, businesses(name, slug), profiles!commercial_commissions_commercial_id_fkey(full_name, email)")
        .order("reference_month", { ascending: false });
      if (commercialId) query = query.eq("commercial_id", commercialId);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useMyCommissions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-commissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("commercial_commissions" as any)
        .select("*, businesses(name, slug, commercial_plans(name))")
        .eq("commercial_id", user.id)
        .order("reference_month", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });
};

export const useMarkCommissionPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Get current commission for audit
      const { data: current } = await supabase
        .from("commercial_commissions" as any)
        .select("status, amount")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("commercial_commissions" as any)
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // Audit log
      const currentData = current as any;
      if (currentData) {
        await supabase.from("commission_audit_logs" as any).insert({
          commission_id: id,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          old_status: currentData.status,
          new_status: "paid",
          old_amount: currentData.amount,
          new_amount: currentData.amount,
          reason: "Marcada como paga",
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-commissions"] });
      qc.invalidateQueries({ queryKey: ["commission-audit-logs"] });
    },
  });
};

export const useValidateCommission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase
        .from("commercial_commissions" as any)
        .select("status, amount")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("commercial_commissions" as any)
        .update({ status: "validated" })
        .eq("id", id);
      if (error) throw error;

      const currentData = current as any;
      if (currentData) {
        await supabase.from("commission_audit_logs" as any).insert({
          commission_id: id,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          old_status: currentData.status,
          new_status: "validated",
          old_amount: currentData.amount,
          new_amount: currentData.amount,
          reason: "Validada por admin",
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-commissions"] });
      qc.invalidateQueries({ queryKey: ["commission-audit-logs"] });
    },
  });
};

export const useReverseCommission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      // Get original commission
      const { data: original, error: fetchErr } = await supabase
        .from("commercial_commissions" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const orig = original as any;
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Create negative commission
      const { error: insertErr } = await supabase
        .from("commercial_commissions" as any)
        .insert({
          commercial_id: orig.commercial_id,
          business_id: orig.business_id,
          commission_model_id: orig.commission_model_id,
          reference_month: orig.reference_month,
          amount: -Math.abs(Number(orig.amount)),
          status: "generated",
          adjustment_type: "reversal",
          original_commission_id: id,
          revenue_event_id: orig.revenue_event_id,
        } as any);
      if (insertErr) throw insertErr;

      // Update original to reversed
      const { error: updateErr } = await supabase
        .from("commercial_commissions" as any)
        .update({ status: "reversed" })
        .eq("id", id);
      if (updateErr) throw updateErr;

      // Audit log
      await supabase.from("commission_audit_logs" as any).insert({
        commission_id: id,
        changed_by: userId,
        old_status: orig.status,
        new_status: "reversed",
        old_amount: orig.amount,
        new_amount: -Math.abs(Number(orig.amount)),
        reason,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-commissions"] });
      qc.invalidateQueries({ queryKey: ["commission-audit-logs"] });
    },
  });
};

// ─── Performance KPIs ───

export const usePerformanceRanking = () => {
  return useQuery({
    queryKey: ["performance-ranking"],
    queryFn: async () => {
      // Get all businesses with conversion data
      const { data: businesses, error: bErr } = await supabase
        .from("businesses")
        .select("id, name, converted_by, conversion_price, conversion_date")
        .not("converted_by", "is", null);
      if (bErr) throw bErr;

      // Get all commissions
      const { data: commissions, error: cErr } = await supabase
        .from("commercial_commissions" as any)
        .select("commercial_id, amount, status");
      if (cErr) throw cErr;

      // Get commercial profiles
      const commercialIds = [...new Set([
        ...(businesses || []).map((b: any) => b.converted_by).filter(Boolean),
        ...(commissions || []).map((c: any) => c.commercial_id).filter(Boolean),
      ])];

      if (commercialIds.length === 0) return [];

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", commercialIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // Aggregate per commercial
      const ranking = new Map<string, { conversions: number; revenue: number; commissionGenerated: number; commissionPaid: number }>();

      for (const b of (businesses || []) as any[]) {
        if (!b.converted_by) continue;
        const entry = ranking.get(b.converted_by) || { conversions: 0, revenue: 0, commissionGenerated: 0, commissionPaid: 0 };
        entry.conversions++;
        entry.revenue += Number(b.conversion_price) || 0;
        ranking.set(b.converted_by, entry);
      }

      for (const c of (commissions || []) as any[]) {
        const entry = ranking.get(c.commercial_id) || { conversions: 0, revenue: 0, commissionGenerated: 0, commissionPaid: 0 };
        if (c.status === "paid") {
          entry.commissionPaid += Number(c.amount) || 0;
        }
        entry.commissionGenerated += Number(c.amount) || 0;
        ranking.set(c.commercial_id, entry);
      }

      return Array.from(ranking.entries())
        .map(([id, data]) => ({
          id,
          name: profileMap.get(id)?.full_name || profileMap.get(id)?.email || "Desconhecido",
          email: profileMap.get(id)?.email || "",
          ...data,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    },
  });
};

export const usePerformanceTimeSeries = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["performance-timeseries", startDate, endDate],
    queryFn: async () => {
      const { data: businesses, error: bErr } = await supabase
        .from("businesses")
        .select("converted_by, conversion_date, conversion_price")
        .not("converted_by", "is", null)
        .gte("conversion_date", startDate)
        .lte("conversion_date", endDate);
      if (bErr) throw bErr;

      const { data: commissions, error: cErr } = await supabase
        .from("commercial_commissions" as any)
        .select("commercial_id, reference_month, amount, status")
        .gte("reference_month", startDate)
        .lte("reference_month", endDate);
      if (cErr) throw cErr;

      // Aggregate by month
      const monthlyData = new Map<string, { conversions: number; revenue: number; commission: number }>();

      for (const b of (businesses || []) as any[]) {
        const month = b.conversion_date?.substring(0, 7);
        if (!month) continue;
        const entry = monthlyData.get(month) || { conversions: 0, revenue: 0, commission: 0 };
        entry.conversions++;
        entry.revenue += Number(b.conversion_price) || 0;
        monthlyData.set(month, entry);
      }

      for (const c of (commissions || []) as any[]) {
        const month = c.reference_month?.substring(0, 7);
        if (!month) continue;
        const entry = monthlyData.get(month) || { conversions: 0, revenue: 0, commission: 0 };
        entry.commission += Number(c.amount) || 0;
        monthlyData.set(month, entry);
      }

      return Array.from(monthlyData.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
  });
};

// ─── Commercial Users List ───

export const useCommercialUsers = () => {
  return useQuery({
    queryKey: ["commercial-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(user_id, full_name, email)")
        .eq("role", "commercial");
      if (error) throw error;
      return (data || []).map((d: any) => ({
        user_id: d.user_id,
        full_name: d.profiles?.full_name || "",
        email: d.profiles?.email || "",
      }));
    },
  });
};
