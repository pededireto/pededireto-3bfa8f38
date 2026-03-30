import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Tipos novos ──────────────────────────────────────────────────────────────

export interface BusinessSearchResult {
  id: string;
  name: string;
  city: string | null;
}

// ─── Hook existente (sem alterações) ─────────────────────────────────────────

export function useAdminUsers() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase.rpc("admin_set_user_role" as any, {
        p_user_id: userId,
        p_role: role,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return { list, setRole };
}

// ─── NOVO: Pesquisa de negócios (para o dialog de associação) ─────────────────

export const useBusinessSearch = (query: string) => {
  return useQuery({
    queryKey: ["admin-business-search", query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, city")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(10);
      if (error) throw error;
      return (data || []) as BusinessSearchResult[];
    },
  });
};

// ─── NOVO: Buscar negócios de um utilizador ───────────────────────────────────

export const useUserBusinesses = (userId: string | null) => {
  return useQuery({
    queryKey: ["admin-user-businesses", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_users")
        .select("business_id, businesses(id, name, city)")
        .eq("user_id", userId);
      if (error) throw error;
      return ((data || []).map((r: any) => r.businesses).filter(Boolean)) as BusinessSearchResult[];
    },
  });
};

// ─── NOVO: Associar negócio a utilizador ─────────────────────────────────────
//
// Usa RPC com security definer para evitar o FK error:
//   "insert or update on table business_users violates foreign key constraint
//    business_users_user_id_fkey"
//
// A RPC verifica que o user_id existe em auth.users antes do insert.
// Ver supabase_rpcs.sql para o código SQL a correr no Supabase.

export const useAssociateBusinessToUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, businessId }: { userId: string; businessId: string }) => {
      const { error } = await (supabase as any).rpc("admin_associate_business_to_user", {
        p_user_id: userId,
        p_business_id: businessId,
      });
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      toast.success("Negócio associado com sucesso");
      qc.invalidateQueries({ queryKey: ["admin-user-businesses", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao associar negócio"),
  });
};

// ─── NOVO: Remover associação negócio ↔ utilizador ───────────────────────────

export const useRemoveBusinessFromUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, businessId }: { userId: string; businessId: string }) => {
      const { error } = await (supabase as any)
        .from("business_users")
        .delete()
        .eq("user_id", userId)
        .eq("business_id", businessId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      toast.success("Associação removida");
      qc.invalidateQueries({ queryKey: ["admin-user-businesses", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover associação"),
  });
};

// ─── NOVO: Criar conta manualmente (admin) ────────────────────────────────────
//
// Ver supabase_rpcs.sql para o código SQL a correr no Supabase.

export const useCreateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
      phone,
    }: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
    }) => {
      const { data, error } = await (supabase as any).rpc("admin_create_user", {
        p_email: email,
        p_password: password,
        p_full_name: fullName,
        p_phone: phone || null,
      });
      if (error) throw error;
      return data as string; // UUID do novo utilizador
    },
    onSuccess: () => {
      toast.success("Conta criada com sucesso");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar conta"),
  });
};
