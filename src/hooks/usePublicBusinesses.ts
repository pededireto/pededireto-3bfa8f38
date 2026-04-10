/**
 * usePublicBusinesses.ts
 *
 * Hooks para páginas PÚBLICAS — usam a view `businesses_public`
 * que já aplica automaticamente:
 *   - Filtro is_active (consentimento de presença)
 *   - Regras de visibilidade por plano (WhatsApp só PRO, galeria limitada, etc.)
 *
 * Os hooks em useBusinesses.ts continuam a existir para uso INTERNO
 * (admin, dashboard, etc.) onde se precisa de aceder a todos os dados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  city: string | null;
  zone: string | null;
  alcance: "local" | "nacional" | "hibrido";
  public_address: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  is_featured: boolean;
  is_premium: boolean;
  premium_level: string | null;
  display_order: number;
  ranking_score: number | null;
  plan_level: "free" | "start" | "pro";
  badge: "START" | "PRO" | null;
  cta_phone: string | null;
  cta_email: string | null;
  cta_website: string | null;
  schedule_weekdays: string | null;
  schedule_weekend: string | null;
  images: string[] | null;
  cta_whatsapp: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  other_social_url: string | null;
  claim_status: string | null;
}

export interface PublicBusinessWithCategory extends PublicBusiness {
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
  business_review_stats?: {
    average_rating: number;
    total_reviews: number;
  } | null;
}

const PUBLIC_SELECT = `
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
  ),
  business_review_stats (
    average_rating,
    total_reviews
  )
`;

export const usePublicBusinesses = (categoryId?: string, city?: string, subcategoryId?: string) => {
  return useQuery({
    queryKey: ["public-businesses", categoryId, city, subcategoryId],
    queryFn: async () => {
      if (subcategoryId) {
        const { data: junctionData, error: jError } = await supabase
          .from("business_subcategories")
          .select("business_id")
          .eq("subcategory_id", subcategoryId);

        if (jError) throw jError;
        if (!junctionData || junctionData.length === 0) return [];

        const businessIds = junctionData.map((j) => j.business_id);

        let query = (supabase as any)
          .from("businesses_public")
          .select(PUBLIC_SELECT)
          .in("id", businessIds)
          .order("is_featured", { ascending: false })
          .order("is_premium", { ascending: false })
          .order("ranking_score", { ascending: false }) // ← ranking por eventos
          .order("display_order", { ascending: true });

        if (categoryId) query = query.eq("category_id", categoryId);
        if (city) query = query.or(`city.ilike.%${city}%,alcance.eq.nacional`);

        const { data, error } = await query;
        if (error) throw error;
        return data as unknown as PublicBusinessWithCategory[];
      }

      let query = (supabase as any)
        .from("businesses_public")
        .select(PUBLIC_SELECT)
        .order("is_featured", { ascending: false })
        .order("is_premium", { ascending: false })
        .order("ranking_score", { ascending: false }) // ← ranking por eventos
        .order("display_order", { ascending: true });

      if (categoryId) query = query.eq("category_id", categoryId);
      if (city) query = query.or(`city.ilike.%${city}%,alcance.eq.nacional`);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PublicBusinessWithCategory[];
    },
  });
};

export const usePublicBusiness = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["public-business", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await (supabase as any)
        .from("businesses_public")
        .select(PUBLIC_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as PublicBusinessWithCategory | null;
    },
    enabled: !!slug,
  });
};

export const usePublicFeaturedBusinesses = (categoryId?: string) => {
  return useQuery({
    queryKey: ["public-businesses", "featured", categoryId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("businesses_public")
        .select(PUBLIC_SELECT)
        .eq("is_featured", true)
        .order("display_order", { ascending: true })
        .limit(6);

      if (categoryId) query = query.eq("category_id", categoryId);

      query = query.or("premium_level.is.null,premium_level.neq.SUPER");

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PublicBusinessWithCategory[];
    },
  });
};
