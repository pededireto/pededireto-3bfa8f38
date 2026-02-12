import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";

export const useBusinessByUser = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["business-by-user", user?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select(`*, categories(id, name, slug, icon), subcategories(id, name, slug)`)
        .eq("owner_email", user.email)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as BusinessWithCategory | null;
    },
    enabled: !!user?.email,
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
            id, description, address, status, created_at,
            categories (id, name),
            subcategories (id, name)
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
