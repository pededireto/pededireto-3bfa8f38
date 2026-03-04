import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  request_count?: number;
  // Adicionados via view/join
  email_confirmed_at: string | null;
  app_role: string | null; // role em user_roles (pode ser null se não existir)
}

// Usa a view profiles_with_confirmation + join com user_roles
export const useAllUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Buscar profiles com email_confirmed_at
      const { data: profiles, error } = await (supabase as any)
        .from("profiles_with_confirmation")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Buscar todos os roles
      const { data: roles } = await (supabase as any).from("user_roles").select("user_id, role");

      // Mapear roles por user_id (auth UUID)
      const rolesMap: Record<string, string> = {};
      for (const r of roles || []) {
        rolesMap[r.user_id] = r.role;
      }

      return (profiles || []).map((p: any) => ({
        ...p,
        app_role: rolesMap[p.user_id] ?? null,
      })) as UserProfile[];
    },
  });
};

// SEM ALTERAÇÕES
export const useUserRequestCounts = () => {
  return useQuery({
    queryKey: ["user-request-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_requests" as any).select("user_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      });
      return counts;
    },
  });
};

// SEM ALTERAÇÕES
export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

// Confirmar email manualmente
export const useConfirmUserEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await (supabase as any).rpc("admin_confirm_user_email", {
        p_user_id: profileId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email confirmado com sucesso");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao confirmar email"),
  });
};

// NOVO: Corrigir role em falta — atribui 'user' se não tiver nenhum role
export const useFixUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      // admin_set_user_role já foi corrigido para aceitar profiles.id
      const { error } = await (supabase as any).rpc("admin_set_user_role", {
        p_user_id: profileId,
        p_role: "user",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role corrigido para 'user'");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao corrigir role"),
  });
};
