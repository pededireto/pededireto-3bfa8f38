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
  businesses?: { name: string } | null;
}

export const useAllServiceRequests = () => {
  return useQuery({
    queryKey: ["service-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select(`
          *,
          profiles:user_id (full_name, email),
          categories:category_id (name),
          subcategories:subcategory_id (name)
        `)
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
        .select(`
          *,
          businesses:business_id (name)
        `)
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
      const updates: any = { status };
      if (status === "concluido" || status === "cancelado") {
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

export const useUpdateMatchStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, requestId }: { id: string; status: string; requestId: string }) => {
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

export const useConsumerRequests = () => {
  return useQuery({
    queryKey: ["consumer-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select(`
          id, description, status, urgency, created_at,
          location_city, location_postal_code,
          categories:category_id (name),
          subcategories:subcategory_id (name)
        `)
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
      const thisMonth = requests.filter(r => r.created_at >= startOfMonth).length;
      const concluded = requests.filter(r => r.status === "concluido").length;
      const forwarded = requests.filter(r => r.status === "encaminhado" || r.status === "concluido").length;

      // By category
      const byCat: Record<string, number> = {};
      requests.forEach(r => {
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
