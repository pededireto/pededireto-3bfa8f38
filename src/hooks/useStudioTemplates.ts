import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface StudioTemplate {
  id: string;
  user_id: string | null;
  category_id: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
  objectivo: string;
  estilo: string;
  toms: number[];
  descricao_sugerida: string | null;
  servicos_sugeridos: string | null;
  diferencial_sugerido: string | null;
  usage_count: number;
  created_at: string;
}

// ── Ler todos os templates disponíveis (sistema + próprios) ──────────────
export const useStudioTemplates = () => {
  return useQuery({
    queryKey: ["studio_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_templates")
        .select("*")
        .order("is_system", { ascending: false })
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data as StudioTemplate[];
    },
  });
};

// ── Ler apenas templates do utilizador ──────────────────────────────────
export const useMyStudioTemplates = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["studio_templates", "mine", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_templates")
        .select("*")
        .eq("is_system", false)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StudioTemplate[];
    },
    enabled: !!user,
  });
};

// ── Guardar template a partir de uma geração ────────────────────────────
export const useSaveStudioTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      objectivo: string;
      estilo: string;
      toms: number[];
      descricao_sugerida?: string;
      servicos_sugeridos?: string;
      diferencial_sugerido?: string;
      category_id?: string;
    }) => {
      if (!user) throw new Error("Utilizador não autenticado");
      const { data, error } = await supabase
        .from("studio_templates")
        .insert({
          user_id: user.id,
          is_system: false,
          ...template,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio_templates"] });
    },
    onError: (error: any) => {
      console.error("useSaveStudioTemplate error:", error);
    },
  });
};

// ── Apagar template próprio ──────────────────────────────────────────────
export const useDeleteStudioTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("studio_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio_templates"] });
    },
    onError: (error: any) => {
      console.error("useDeleteStudioTemplate error:", error);
    },
  });
};

// ── Incrementar usage_count quando template é usado ─────────────────────
export const useIncrementTemplateUsage = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("increment_template_usage", { template_id: id });
      if (error) {
        // Fallback manual se a RPC não existir
        const { data: current } = await supabase
          .from("studio_templates")
          .select("usage_count")
          .eq("id", id)
          .single();
        if (current) {
          await supabase
            .from("studio_templates")
            .update({ usage_count: (current.usage_count || 0) + 1 })
            .eq("id", id);
        }
      }
    },
  });
};
