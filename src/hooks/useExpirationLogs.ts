import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExpirationLog {
  id: string;
  business_id: string;
  plan_name: string;
  plan_price: number;
  expired_at: string;
  deactivated_at: string;
  contact_status: string;
  contacted_at: string | null;
  notes: string | null;
  // joined from businesses
  business_name?: string;
  cta_whatsapp?: string | null;
  cta_phone?: string | null;
  cta_email?: string | null;
}

interface UseExpirationLogsOptions {
  period?: "today" | "7days" | "30days" | "all";
  planName?: string;
  contactStatus?: string;
}

export const useExpirationLogs = (options: UseExpirationLogsOptions = {}) => {
  const { period = "all", planName, contactStatus } = options;

  return useQuery({
    queryKey: ["expiration-logs", period, planName, contactStatus],
    queryFn: async () => {
      let query = supabase
        .from("expiration_logs" as any)
        .select("*, businesses(name, cta_whatsapp, cta_phone, cta_email)")
        .order("deactivated_at", { ascending: false });

      // Period filter
      if (period !== "all") {
        const now = new Date();
        let from: Date;
        if (period === "today") {
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === "7days") {
          from = new Date(now);
          from.setDate(from.getDate() - 7);
        } else {
          from = new Date(now);
          from.setDate(from.getDate() - 30);
        }
        query = query.gte("deactivated_at", from.toISOString());
      }

      if (planName) {
        query = query.eq("plan_name", planName);
      }

      if (contactStatus) {
        query = query.eq("contact_status", contactStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as any[]).map((log) => ({
        id: log.id,
        business_id: log.business_id,
        plan_name: log.plan_name,
        plan_price: log.plan_price,
        expired_at: log.expired_at,
        deactivated_at: log.deactivated_at,
        contact_status: log.contact_status,
        contacted_at: log.contacted_at,
        notes: log.notes,
        business_name: log.businesses?.name,
        cta_whatsapp: log.businesses?.cta_whatsapp,
        cta_phone: log.businesses?.cta_phone,
        cta_email: log.businesses?.cta_email,
      })) as ExpirationLog[];
    },
  });
};

export const useUncontactedCount = () => {
  return useQuery({
    queryKey: ["expiration-logs-uncontacted-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("expiration_logs" as any)
        .select("*", { count: "exact", head: true })
        .eq("contact_status", "nao_contactado");
      if (error) throw error;
      return count || 0;
    },
  });
};

export const useUpdateContactStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contact_status, notes }: { id: string; contact_status: string; notes?: string }) => {
      const updates: any = {
        contact_status,
        contacted_at: contact_status !== "nao_contactado" ? new Date().toISOString() : null,
      };
      if (notes !== undefined) updates.notes = notes;

      const { error } = await supabase
        .from("expiration_logs" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expiration-logs"] });
      qc.invalidateQueries({ queryKey: ["expiration-logs-uncontacted-count"] });
    },
  });
};
