import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── BUSINESS SEARCH ──────────────────────────────────────
export const useBusinessSearch = (searchQuery: string) => {
  return useQuery({
    queryKey: ["business-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, owner_email, owner_name, city, is_active")
        .or(`name.ilike.%${searchQuery}%,owner_email.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%`)
        .limit(20);
      if (error) throw error;
      return data.map(b => ({
        id: b.id,
        name: b.name,
        email: b.owner_email,
        ownerName: b.owner_name,
        city: b.city,
        isActive: b.is_active,
      }));
    },
    enabled: searchQuery.length >= 2,
  });
};

// ─── SEGMENT PREVIEW ──────────────────────────────────────
export interface SegmentFilters {
  category_id?: string;
  subcategory_id?: string;
  commercial_status?: string;
  has_email?: boolean;
  limit?: number;
  offset?: number;
}

export interface SegmentBusiness {
  id: string;
  name: string;
  email: string;
  owner_name: string;
  city: string;
  commercial_status: string;
  category: string;
}

export const useSegmentPreview = (filters: SegmentFilters, enabled: boolean) => {
  return useQuery({
    queryKey: ["segment-preview", filters],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_businesses_for_cadence", {
        p_category_id: filters.category_id || null,
        p_subcategory_id: filters.subcategory_id || null,
        p_commercial_status: filters.commercial_status || null,
        p_has_email: filters.has_email ?? true,
        p_limit: filters.limit || 100,
        p_offset: filters.offset || 0,
      });
      if (error) throw error;
      const raw = data as any;
      return {
        total: raw?.total ?? 0,
        businesses: (raw?.businesses ?? []) as SegmentBusiness[],
      };
    },
    enabled,
  });
};

// ─── BULK ENROLL ──────────────────────────────────────────
export const useBulkEnrollInCadence = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      cadence_id,
      businesses,
      pause_on_reply = true,
    }: {
      cadence_id: string;
      businesses: SegmentBusiness[];
      pause_on_reply?: boolean;
    }) => {
      // Insert em lotes de 50 para evitar timeout
      const BATCH = 50;
      let enrolled = 0;
      let skipped = 0;

      for (let i = 0; i < businesses.length; i += BATCH) {
        const batch = businesses.slice(i, i + BATCH);
        const rows = batch
          .filter(b => b.email)
          .map(b => ({
            cadence_id,
            business_id: b.id,
            recipient_email: b.email,
            pause_on_reply,
            enrolled_by: user?.id,
            status: "active",
          }));

        if (rows.length === 0) continue;

        // upsert ignorando duplicados
        const { error } = await (supabase as any)
          .from("email_cadence_enrollments")
          .upsert(rows, { onConflict: "cadence_id,recipient_email", ignoreDuplicates: true });

        if (error) throw error;
        enrolled += rows.length;
        skipped += batch.length - rows.length;
      }

      return { enrolled, skipped };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadence-enrollments"] });
    },
  });
};

// ─── TEMPLATES ────────────────────────────────────────────
export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (template: { name: string; subject: string; html_content: string; text_content?: string; category?: string; variables?: any }) => {
      const { error } = await (supabase as any).from("email_templates").insert({ ...template, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; subject?: string; html_content?: string; text_content?: string; category?: string; is_active?: boolean }) => {
      const { error } = await (supabase as any).from("email_templates").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
};

// ─── CAMPAIGNS ────────────────────────────────────────────
export const useEmailCampaigns = () => {
  return useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_campaigns")
        .select("*, email_templates(name, subject)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (campaign: { name: string; template_id: string; segment_criteria?: any; scheduled_at?: string }) => {
      const { error } = await (supabase as any).from("email_campaigns").insert({ ...campaign, status: "draft", created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-campaigns"] }),
  });
};

export const useUpdateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; status?: string; template_id?: string; segment_criteria?: any; scheduled_at?: string; recipient_count?: number }) => {
      const { error } = await (supabase as any).from("email_campaigns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-campaigns"] }),
  });
};

// ─── LOGS ─────────────────────────────────────────────────
export const useEmailLogs = (filters?: { campaignId?: string; limit?: number }) => {
  return useQuery({
    queryKey: ["email-logs", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(filters?.limit || 100);
      if (filters?.campaignId) query = query.eq("campaign_id", filters.campaignId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// ─── CADENCES ─────────────────────────────────────────────
export const useEmailCadences = () => {
  return useQuery({
    queryKey: ["email-cadences"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_cadences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCadence = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (cadence: { name: string; description?: string; category?: string }) => {
      const { data, error } = await (supabase as any).from("email_cadences").insert({ ...cadence, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-cadences"] }),
  });
};

export const useCadenceSteps = (cadenceId: string | undefined) => {
  return useQuery({
    queryKey: ["cadence-steps", cadenceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_cadence_steps")
        .select("*, email_templates(name, subject)")
        .eq("cadence_id", cadenceId)
        .order("step_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!cadenceId,
  });
};

export const useAddCadenceStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (step: { cadence_id: string; template_id: string; step_order: number; delay_days: number; delay_hours?: number }) => {
      const { error } = await (supabase as any).from("email_cadence_steps").insert(step);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["cadence-steps", vars.cadence_id] }),
  });
};

export const useDeleteCadenceStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cadenceId }: { id: string; cadenceId: string }) => {
      const { error } = await (supabase as any).from("email_cadence_steps").delete().eq("id", id);
      if (error) throw error;
      return cadenceId;
    },
    onSuccess: (cadenceId) => qc.invalidateQueries({ queryKey: ["cadence-steps", cadenceId] }),
  });
};

// ─── ENROLLMENTS ──────────────────────────────────────────
export const useCadenceEnrollments = (cadenceId?: string) => {
  return useQuery({
    queryKey: ["cadence-enrollments", cadenceId],
    queryFn: async () => {
      let query = (supabase as any).from("email_cadence_enrollments").select("*").order("enrolled_at", { ascending: false });
      if (cadenceId) query = query.eq("cadence_id", cadenceId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useEnrollInCadence = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (enrollment: { cadence_id: string; recipient_email: string; business_id?: string; pause_on_reply?: boolean }) => {
      const { error } = await (supabase as any).from("email_cadence_enrollments").insert({ ...enrollment, enrolled_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cadence-enrollments"] }),
  });
};

// ─── INBOX ────────────────────────────────────────────────
export const useEmailInbox = () => {
  return useQuery({
    queryKey: ["email-inbox"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_inbox")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateInboxItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; assigned_to?: string; tags?: string[] }) => {
      const { error } = await (supabase as any).from("email_inbox").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-inbox"] }),
  });
};

// ─── NOTIFICATIONS ────────────────────────────────────────
export const useEmailNotifications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["email-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useMarkEmailNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("email_notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-notifications"] }),
  });
};

// ─── ANALYTICS ────────────────────────────────────────────
export const useEmailPerformance = () => {
  return useQuery({
    queryKey: ["email-performance"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("email_performance_summary").select("*");
      if (error) throw error;
      return data;
    },
  });
};

export const useCadencePerformance = () => {
  return useQuery({
    queryKey: ["cadence-performance"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("cadence_enrollment_summary").select("*");
      if (error) throw error;
      return data;
    },
  });
};

// ─── SEND EMAIL ───────────────────────────────────────────
export const useSendEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { to: string; subject: string; html: string; templateId?: string; campaignId?: string; metadata?: any }) => {
      const { data, error } = await supabase.functions.invoke("send-email", { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-logs"] });
      qc.invalidateQueries({ queryKey: ["email-notifications"] });
    },
  });
};

// ─── UTILITIES ────────────────────────────────────────────
export const renderTemplate = (html: string, data: Record<string, string | undefined>): string => {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] ?? "");
};
