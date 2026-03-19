import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CommercialStatus } from "@/hooks/useBusinesses";

export interface PipelineEntry {
  id: string;
  business_id: string;
  assigned_to: string | null;
  phase: CommercialStatus;
  next_followup_date: string | null;
  followup_note: string | null;
  visit_result: string | null;
  created_at: string;
  updated_at: string;
  businesses?: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    cta_phone: string | null;
    cta_email: string | null;
    commercial_status: CommercialStatus;
    subscription_status: string;
    subscription_price: number;
    logo_url: string | null;
    categories?: { name: string } | null;
    subcategories?: { name: string } | null;
  };
  profiles?: { full_name: string; email: string } | null;
}

const PIPELINE_SELECT = `
  *,
  businesses!inner(id, name, slug, city, cta_phone, cta_email, commercial_status, subscription_status, subscription_price, logo_url,
    categories(name), subcategories(name)),
  profiles:assigned_to(full_name, email)
`;

// All pipeline entries (admin view)
export const useAllPipeline = () => {
  return useQuery({
    queryKey: ["commercial-pipeline-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_pipeline" as any)
        .select(PIPELINE_SELECT)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PipelineEntry[];
    },
  });
};

// My pipeline entries (commercial view)
export const useMyPipeline = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["commercial-pipeline-mine", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("commercial_pipeline" as any)
        .select(PIPELINE_SELECT)
        .eq("assigned_to", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PipelineEntry[];
    },
    enabled: !!user?.id,
  });
};

// Upsert pipeline entry (creates or updates)
export const useUpsertPipeline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      business_id: string;
      assigned_to?: string;
      phase?: CommercialStatus;
      next_followup_date?: string | null;
      followup_note?: string | null;
      visit_result?: string | null;
    }) => {
      const { data: existing } = await supabase
        .from("commercial_pipeline" as any)
        .select("id")
        .eq("business_id", params.business_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("commercial_pipeline" as any)
          .update({ ...params, updated_at: new Date().toISOString() })
          .eq("business_id", params.business_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("commercial_pipeline" as any)
          .insert(params);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-pipeline-all"] });
      qc.invalidateQueries({ queryKey: ["commercial-pipeline-mine"] });
    },
  });
};

// Update phase (used by drag & drop)
export const useUpdatePipelinePhase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ business_id, phase }: { business_id: string; phase: CommercialStatus }) => {
      // Update pipeline
      const { data: existing } = await supabase
        .from("commercial_pipeline" as any)
        .select("id")
        .eq("business_id", business_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("commercial_pipeline" as any)
          .update({ phase, updated_at: new Date().toISOString() })
          .eq("business_id", business_id);
      }

      // Also update business commercial_status
      await supabase
        .from("businesses")
        .update({ commercial_status: phase } as any)
        .eq("id", business_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-pipeline-all"] });
      qc.invalidateQueries({ queryKey: ["commercial-pipeline-mine"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};

// Assign business to commercial + create pipeline entry
export const useAssignToMe = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (business_id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check ALL existing active assignments for this business (not just own)
      const { data: allAssignments } = await supabase
        .from("business_commercial_assignments" as any)
        .select("id, commercial_id, is_active")
        .eq("business_id", business_id)
        .eq("is_active", true);

      const existing = (allAssignments || []) as any[];
      const myAssignment = existing.find((a: any) => a.commercial_id === user.id);
      const otherAssignment = existing.find((a: any) => a.commercial_id !== user.id);

      if (myAssignment) {
        throw new Error("ALREADY_MINE");
      }

      if (otherAssignment) {
        // Fetch the other commercial's name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", otherAssignment.commercial_id)
          .maybeSingle();
        throw new Error(`ASSIGNED_OTHER:${(profile as any)?.full_name || "outro comercial"}`);
      }

      // Create assignment
      await supabase
        .from("business_commercial_assignments" as any)
        .insert({ business_id, commercial_id: user.id, role: "sales" });

      // Create pipeline entry if not exists
      const { data: pipelineExists } = await supabase
        .from("commercial_pipeline" as any)
        .select("id")
        .eq("business_id", business_id)
        .maybeSingle();

      if (!pipelineExists) {
        await supabase
          .from("commercial_pipeline" as any)
          .insert({ business_id, assigned_to: user.id, phase: "nao_contactado" });
      } else {
        await supabase
          .from("commercial_pipeline" as any)
          .update({ assigned_to: user.id, updated_at: new Date().toISOString() })
          .eq("business_id", business_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-pipeline-all"] });
      qc.invalidateQueries({ queryKey: ["commercial-pipeline-mine"] });
      qc.invalidateQueries({ queryKey: ["commercial-assignments"] });
      qc.invalidateQueries({ queryKey: ["my-commercial-assignments"] });
    },
  });
};

// Pipeline phases config
export const PIPELINE_PHASES: { value: CommercialStatus; label: string; emoji: string; color: string }[] = [
  { value: "nao_contactado", label: "Não Contactado", emoji: "📋", color: "bg-muted text-muted-foreground" },
  { value: "contactado", label: "1º Contacto", emoji: "📞", color: "bg-primary/10 text-primary" },
  { value: "interessado", label: "Interessado", emoji: "🤝", color: "bg-accent text-accent-foreground" },
  { value: "proposta_enviada", label: "Proposta Enviada", emoji: "📧", color: "bg-warning/10 text-warning" },
  { value: "negociacao", label: "Negociação", emoji: "💬", color: "bg-primary/20 text-primary" },
  { value: "cliente", label: "Fechado — Ganho", emoji: "✅", color: "bg-success/10 text-success" },
  { value: "perdido", label: "Fechado — Perdido", emoji: "❌", color: "bg-destructive/10 text-destructive" },
  { value: "followup_agendado", label: "Follow-Up", emoji: "🔄", color: "bg-primary/15 text-primary" },
];
