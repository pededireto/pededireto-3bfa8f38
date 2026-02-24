import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";

export const useBusinessByUser = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["business-by-user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // First try via business_users table (claim flow)
      const { data: buData } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (buData?.business_id) {
        const { data, error } = await supabase
          .from("businesses")
          .select(`*, categories(id, name, slug, icon), subcategories(id, name, slug)`)
          .eq("id", buData.business_id)
          .maybeSingle();
        if (!error && data) return data as unknown as BusinessWithCategory;
      }
      // Fallback to owner_email match
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

export const useBusinessRequests = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-requests", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("request_business_matches" as any)
        .select(`
          *,
          service_requests (
            id, description, address, status, created_at, urgency,
            location_city, location_postal_code,
            categories (id, name),
            subcategories (id, name),
            profiles:user_id (full_name, email, phone, city)
          )
        `)
        .eq("business_id", businessId)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!businessId,
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
      // Mensagens não lidas enviadas pelo consumidor (sender_role = "consumer")
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
    refetchInterval: 30000, // polling a cada 30s
    queryFn: async () => {
      if (!businessId) return 0;

      // Buscar todos os request_ids associados a este negócio
      const { data: matches, error: matchError } = await supabase
        .from("request_business_matches" as any)
        .select("request_id")
        .eq("business_id", businessId);
      if (matchError) throw matchError;

      const requestIds = (matches || []).map((m: any) => m.request_id);
      if (requestIds.length === 0) return 0;

      // Contar mensagens não lidas do consumidor
      const { data: unread, error: msgError } = await supabase
        .from("request_messages" as any)
        .select("request_id")
        .in("request_id", requestIds)
        .eq("sender_role", "consumer")
        .is("read_at", null);
      if (msgError) throw msgError;

      // Contar pedidos únicos com não lidas (não o nº de mensagens)
      const uniqueRequests = new Set((unread || []).map((m: any) => m.request_id));
      return uniqueRequests.size;
    },
  });
};
