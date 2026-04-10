import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceRequest {
  id: string;
  user_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  description: string | null;
  address: string | null;
  urgency: string | null;
  location_city: string | null;
  location_postal_code: string | null;
  status: string;
  assigned_to_admin: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  profiles?: { full_name: string | null; email: string | null } | null;
  categories?: { name: string } | null;
  subcategories?: { name: string } | null;
}

export interface RequestBusinessMatch {
  id: string;
  request_id: string;
  business_id: string;
  sent_at: string;
  status: string;
  responded_at: string | null;
  price_quote: string | null;
  reminder_count: number | null;
  reminder_sent_at: string | null;
  businesses?: { name: string } | null;
}

export const useAllServiceRequests = () => {
  return useQuery({
    queryKey: ["service-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select(
          `
          *,
          profiles:user_id (full_name, email),
          categories:category_id (name),
          subcategories:subcategory_id (name)
        `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ServiceRequest[];
    },
  });
};

export const useRequestMatches = (requestId: string | null) => {
  return useQuery({
    queryKey: ["request-matches", requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_business_matches" as any)
        .select(
          `
          *,
          businesses:business_id (name)
        `,
        )
        .eq("request_id", requestId!)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RequestBusinessMatch[];
    },
  });
};

export const useUpdateRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === "fechado" || status === "cancelado") {
        updates.closed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("service_requests" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-requests"] }),
  });
};

export const useAssignRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adminId }: { id: string; adminId: string | null }) => {
      const { error } = await supabase
        .from("service_requests" as any)
        .update({ assigned_to_admin: adminId } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-requests"] }),
  });
};

export const useCreateMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, businessId }: { requestId: string; businessId: string }) => {
      const { error } = await supabase
        .from("request_business_matches" as any)
        .insert({ request_id: requestId, business_id: businessId } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["request-matches", vars.requestId] });
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
};

// ── Actualiza apenas o status do match (aceite/recusado/enviado) ─────────────
// NÃO usar para lembretes — usar useSendMatchReminder
export const useUpdateMatchStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, requestId }: { id: string; status: string; requestId: string }) => {
      // Apenas campos que existem na tabela e são válidos para o enum match_status
      const updates: any = { status };
      if (status !== "enviado") {
        updates.responded_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("request_business_matches" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["request-matches", vars.requestId] });
    },
  });
};

// ── Envia lembrete — actualiza APENAS reminder_count e reminder_sent_at ──────
// NÃO altera o status do match
export const useSendMatchReminder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      currentCount,
      requestId,
    }: {
      id: string;
      currentCount: number | null;
      requestId: string;
    }) => {
      const { error } = await supabase
        .from("request_business_matches" as any)
        .update({
          reminder_count: (currentCount ?? 0) + 1,
          reminder_sent_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["request-matches", vars.requestId] });
    },
  });
};

// ── Remove um match ───────────────────────────────────────────────────────────
export const useRemoveMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, requestId }: { id: string; requestId: string }) => {
      const { error } = await supabase
        .from("request_business_matches" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["request-matches", vars.requestId] });
    },
  });
};

export const useConsumerRequests = () => {
  return useQuery({
    queryKey: ["consumer-requests"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select(
          `
          id, description, status, urgency, created_at,
          location_city, location_postal_code,
          categories:category_id (name),
          subcategories:subcategory_id (name)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
};

export const useServiceRequestStats = () => {
  return useQuery({
    queryKey: ["service-request-stats"],
    queryFn: async () => {
      const { data: allRequests, error } = await supabase
        .from("service_requests" as any)
        .select("id, status, created_at, closed_at, category_id");
      if (error) throw error;

      const requests = (allRequests || []) as any[];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const total = requests.length;
      const thisMonth = requests.filter((r) => r.created_at >= startOfMonth).length;
      const concluded = requests.filter((r) => r.status === "fechado").length;
      const forwarded = requests.filter(
        (r) => r.status === "em_conversa" || r.status === "em_negociacao" || r.status === "fechado",
      ).length;

      const byCat: Record<string, number> = {};
      requests.forEach((r) => {
        if (r.category_id) byCat[r.category_id] = (byCat[r.category_id] || 0) + 1;
      });

      return {
        total,
        thisMonth,
        concluded,
        forwardRate: total > 0 ? ((forwarded / total) * 100).toFixed(1) : "0",
        conclusionRate: total > 0 ? ((concluded / total) * 100).toFixed(1) : "0",
        byCategory: byCat,
      };
    },
  });
};

export interface RequestMeta {
  responses: number;
  hasUnread: boolean;
  hasPending: boolean;
  notified: number;
  viewed: number;
  responded: number;
  hasMessages: boolean;
}

export interface RequestReviewInfo {
  rating: number;
  comment: string | null;
  businessName: string;
}

export const useConsumerRequestReviews = (requestIds: string[]) => {
  return useQuery({
    queryKey: ["consumer-request-reviews", requestIds],
    enabled: requestIds.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (requestIds.length === 0) return {} as Record<string, RequestReviewInfo[]>;

      // Query request_ratings directly by request_id
      const { data: ratings, error: ratErr } = await supabase
        .from("request_ratings" as any)
        .select("request_id, business_id, rating, comment")
        .in("request_id", requestIds);
      if (ratErr) throw ratErr;

      if (!ratings || ratings.length === 0) return {} as Record<string, RequestReviewInfo[]>;

      const allBusinessIds = [...new Set((ratings as any[]).map((r: any) => r.business_id))];
      const { data: businesses } = await supabase.from("businesses").select("id, name").in("id", allBusinessIds);

      const bizNameMap: Record<string, string> = {};
      (businesses || []).forEach((b: any) => {
        bizNameMap[b.id] = b.name;
      });

      const result: Record<string, RequestReviewInfo[]> = {};
      (ratings as any[]).forEach((r: any) => {
        if (!result[r.request_id]) result[r.request_id] = [];
        result[r.request_id].push({
          rating: r.rating,
          comment: r.comment,
          businessName: bizNameMap[r.business_id] || "Negócio",
        });
      });

      return result;
    },
  });
};

export const useConsumerRequestsMeta = (requestIds: string[]) => {
  return useQuery({
    queryKey: ["consumer-requests-meta", requestIds],
    enabled: requestIds.length > 0,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return {} as Record<string, RequestMeta>;

      const { data: matches, error: matchError } = await supabase
        .from("request_business_matches" as any)
        .select("request_id, status, viewed_at, responded_at, first_response_at")
        .in("request_id", requestIds);
      if (matchError) throw matchError;

      const { data: unread, error: msgError } = await supabase
        .from("request_messages" as any)
        .select("request_id")
        .in("request_id", requestIds)
        .eq("sender_role", "business")
        .is("read_at", null);
      if (msgError) throw msgError;

      const { data: allMessages, error: allMsgError } = await supabase
        .from("request_messages" as any)
        .select("request_id")
        .in("request_id", requestIds)
        .limit(500);
      if (allMsgError) throw allMsgError;

      const messageRequestIds = new Set((allMessages || []).map((m: any) => m.request_id));

      const meta: Record<string, RequestMeta> = {};
      requestIds.forEach((id) => {
        const reqMatches = (matches || []).filter((m: any) => m.request_id === id);
        const reqUnread = (unread || []).filter((m: any) => m.request_id === id);

        meta[id] = {
          responses: reqMatches.length,
          hasUnread: reqUnread.length > 0,
          hasPending: reqMatches.some((m: any) => m.status === "enviado"),
          notified: reqMatches.length,
          viewed: reqMatches.filter((m: any) => m.viewed_at != null).length,
          responded: reqMatches.filter((m: any) => m.responded_at != null || m.first_response_at != null).length,
          hasMessages: messageRequestIds.has(id),
        };
      });

      return meta;
    },
  });
};
