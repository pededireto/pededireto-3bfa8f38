import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";

export const useBusinessByUser = () => {
  const { user } = useAuth();

  // Ler o negócio ativo do localStorage (definido pelo switcher)
  const activeBusinessId = localStorage.getItem("activeBusinessId");

  return useQuery({
    queryKey: ["business-by-user", user?.id, activeBusinessId],
    queryFn: async () => {
      if (!user) return null;

      // FIX: resolver profiles.id correto para utilizadores onde profiles.id != auth.uid()
      let profileId = user.id;
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (profile?.id) profileId = profile.id;

      // Se há um negócio ativo selecionado pelo switcher, verificar que pertence ao user
      if (activeBusinessId) {
        const { data: buCheck } = await supabase
          .from("business_users")
          .select("business_id")
          .eq("user_id", profileId)
          .eq("business_id", activeBusinessId)
          .maybeSingle();

        if (buCheck?.business_id) {
          const { data, error } = await supabase
            .from("businesses")
            .select(`*, categories(id, name, slug, icon), subcategories(id, name, slug)`)
            .eq("id", activeBusinessId)
            .maybeSingle();
          if (!error && data) return data as unknown as BusinessWithCategory;
        }
      }

      // Buscar o primeiro negócio do utilizador via profiles.id correto
      const { data: buData } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", profileId)
        .limit(1)
        .maybeSingle();

      if (buData?.business_id) {
        // Guardar como ativo para futuras visitas
        localStorage.setItem("activeBusinessId", buData.business_id);

        const { data, error } = await supabase
          .from("businesses")
          .select(`*, categories(id, name, slug, icon), subcategories(id, name, slug)`)
          .eq("id", buData.business_id)
          .maybeSingle();
        if (!error && data) return data as unknown as BusinessWithCategory;
      }

      // Fallback: buscar por owner_email
      if (user.email) {
        const { data, error } = await supabase
          .from("businesses")
          .select(`*, categories(id, name, slug, icon), subcategories(id, name, slug)`)
          .eq("owner_email", user.email)
          .maybeSingle();
        if (!error && data) return data as unknown as BusinessWithCategory;
      }

      return null;
    },
    enabled: !!user,
  });
};

// ─── Filtros para pedidos ─────────────────────────────────────────────────────

export type RequestArchiveFilter = "active" | "archived" | "all";

export const useBusinessRequests = (businessId: string | undefined, archiveFilter: RequestArchiveFilter = "all") => {
  return useQuery({
    queryKey: ["business-requests", businessId, archiveFilter],
    queryFn: async () => {
      if (!businessId) return [];
      let query = supabase
        .from("request_business_matches" as any)
        .select(
          `
          *,
          service_requests (
            id, description, address, status, created_at, urgency,
            location_city, location_postal_code,
            categories (id, name),
            subcategories (id, name),
            profiles:user_id (full_name, email, phone, city)
          )
        `,
        )
        .eq("business_id", businessId)
        .order("sent_at", { ascending: false });

      if (archiveFilter === "active") {
        query = query.is("archived_at", null);
      } else if (archiveFilter === "archived") {
        query = query.not("archived_at", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!businessId,
  });
};

// ─── Mutações de arquivo ──────────────────────────────────────────────────────

export const useArchiveRequest = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from("request_business_matches" as any)
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
        } as any)
        .eq("id", matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-requests"] });
    },
  });
};

export const useRestoreRequest = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from("request_business_matches" as any)
        .update({
          archived_at: null,
          archived_by: null,
        } as any)
        .eq("id", matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-requests"] });
    },
  });
};

// ─── Meta-dados de não lidas por pedido (perspectiva do business) ─────────────

export interface BusinessRequestMeta {
  hasUnread: boolean;
}

export const useBusinessRequestsMeta = (businessId: string | undefined, requestIds: string[]) => {
  return useQuery({
    queryKey: ["business-requests-meta", businessId, requestIds],
    enabled: !!businessId && requestIds.length > 0,
    queryFn: async () => {
      const { data: unread, error } = await supabase
        .from("request_messages" as any)
        .select("request_id")
        .in("request_id", requestIds)
        .eq("sender_role", "consumer")
        .is("read_at", null);
      if (error) throw error;

      const meta: Record<string, BusinessRequestMeta> = {};
      requestIds.forEach((id) => {
        meta[id] = {
          hasUnread: (unread || []).some((m: any) => m.request_id === id),
        };
      });
      return meta;
    },
  });
};

// ─── Contagem total de não lidas (para badge na sidebar) ─────────────────────

export const useBusinessUnreadRequestsCount = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-unread-requests-count", businessId],
    enabled: !!businessId,
    refetchInterval: 30000,
    queryFn: async () => {
      if (!businessId) return 0;

      const { data: matches, error: matchError } = await supabase
        .from("request_business_matches" as any)
        .select("request_id")
        .eq("business_id", businessId);
      if (matchError) throw matchError;

      const requestIds = (matches || []).map((m: any) => m.request_id);
      if (requestIds.length === 0) return 0;

      const { data: unread, error: msgError } = await supabase
        .from("request_messages" as any)
        .select("request_id")
        .in("request_id", requestIds)
        .eq("sender_role", "consumer")
        .is("read_at", null);
      if (msgError) throw msgError;

      const uniqueRequests = new Set((unread || []).map((m: any) => m.request_id));
      return uniqueRequests.size;
    },
  });
};
