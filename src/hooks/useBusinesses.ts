import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type SubscriptionPlan = "free" | "1_month" | "3_months" | "6_months" | "1_year";
export type SubscriptionStatus = "inactive" | "active" | "expired";
export type CommercialStatus = "nao_contactado" | "contactado" | "interessado" | "cliente" | "perdido";
export type PremiumLevel = "SUPER" | "CATEGORIA" | "SUBCATEGORIA";

export interface Business {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  plan_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  images: string[];
  city: string | null;
  zone: string | null;
  alcance: "local" | "nacional" | "hibrido";
  coordinates: Json | null;
  schedule_weekdays: string | null;
  schedule_weekend: string | null;
  cta_website: string | null;
  cta_whatsapp: string | null;
  cta_phone: string | null;
  cta_email: string | null;
  cta_app: string | null;
  is_featured: boolean;
  is_premium: boolean;
  premium_level: PremiumLevel | null;
  display_order: number;
  is_active: boolean;
  commercial_status: CommercialStatus;
  subscription_plan: SubscriptionPlan;
  subscription_price: number;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface BusinessWithCategory extends Business {
  categories?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  subcategories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const BUSINESS_SELECT = `
  *,
  categories (
    id,
    name,
    slug,
    icon
  ),
  subcategories (
    id,
    name,
    slug
  )
`;

export const useBusinesses = (categoryId?: string, city?: string, subcategoryId?: string) => {
  return useQuery({
    queryKey: ["businesses", categoryId, city, subcategoryId],
    queryFn: async () => {
      // If filtering by subcategory, use junction table for many-to-many
      if (subcategoryId) {
        const { data: junctionData, error: jError } = await supabase
          .from("business_subcategories")
          .select("business_id")
          .eq("subcategory_id", subcategoryId);

        if (jError) throw jError;
        if (!junctionData || junctionData.length === 0) return [];

        const businessIds = junctionData.map((j) => j.business_id);

        let query = supabase
          .from("businesses")
          .select(BUSINESS_SELECT)
          .eq("is_active", true)
          .in("id", businessIds)
          .order("is_featured", { ascending: false })
          .order("is_premium", { ascending: false })
          .order("display_order", { ascending: true });

        if (categoryId) query = query.eq("category_id", categoryId);
        if (city) query = query.or(`city.ilike.%${city}%,alcance.eq.nacional`);

        const { data, error } = await query;
        if (error) throw error;
        return data as unknown as BusinessWithCategory[];
      }

      let query = supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("is_premium", { ascending: false })
        .order("display_order", { ascending: true });

      if (categoryId) query = query.eq("category_id", categoryId);
      if (city) query = query.or(`city.ilike.%${city}%,alcance.eq.nacional`);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as BusinessWithCategory[];
    },
  });
};

export const useFeaturedBusinesses = (categoryId?: string) => {
  return useQuery({
    queryKey: ["businesses", "featured", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("display_order", { ascending: true })
        .limit(6);

      if (categoryId) query = query.eq("category_id", categoryId);

      // Exclude SUPER premium businesses (they appear in Super Destaques section)
      query = query.or("premium_level.is.null,premium_level.neq.SUPER");

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as BusinessWithCategory[];
    },
  });
};

export const useBusiness = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["business", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as BusinessWithCategory | null;
    },
    enabled: !!slug,
  });
};

export const useAllBusinesses = () => {
  return useQuery({
    queryKey: ["businesses", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as BusinessWithCategory[];
    },
  });
};

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (business: Omit<Business, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("businesses")
        .insert(business as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Business> & { id: string }) => {
      const { data, error } = await supabase
        .from("businesses")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};

export const useDeleteBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};

// Subscription plan pricing
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, { label: string; price: number; months: number }> = {
  free: { label: "Gratuito", price: 0, months: 0 },
  "1_month": { label: "1 Mês", price: 15, months: 1 },
  "3_months": { label: "3 Meses", price: 40, months: 3 },
  "6_months": { label: "6 Meses", price: 75, months: 6 },
  "1_year": { label: "1 Ano", price: 120, months: 12 },
};

// Expiring subscriptions query
export const useExpiringSubscriptions = (daysAhead: number) => {
  return useQuery({
    queryKey: ["businesses", "expiring", daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .eq("subscription_status", "active")
        .lte("subscription_end_date", futureDate.toISOString().split("T")[0])
        .gte("subscription_end_date", new Date().toISOString().split("T")[0])
        .order("subscription_end_date", { ascending: true });

      if (error) throw error;
      return data as unknown as BusinessWithCategory[];
    },
  });
};
