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
