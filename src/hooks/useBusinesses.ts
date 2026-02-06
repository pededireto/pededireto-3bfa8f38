import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Business {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  images: string[];
  city: string | null;
  zone: string | null;
  alcance: "local" | "nacional" | "hibrido";
  coordinates: { lat: number; lng: number } | null;
  schedule_weekdays: string | null;
  schedule_weekend: string | null;
  cta_website: string | null;
  cta_whatsapp: string | null;
  cta_phone: string | null;
  cta_email: string | null;
  cta_app: string | null;
  is_featured: boolean;
  is_premium: boolean;
  display_order: number;
  is_active: boolean;
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
}

export const useBusinesses = (categoryId?: string, city?: string) => {
  return useQuery({
    queryKey: ["businesses", categoryId, city],
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            icon
          )
        `)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("is_premium", { ascending: false })
        .order("display_order", { ascending: true });
      
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      
      if (city) {
        query = query.or(`city.ilike.%${city}%,alcance.eq.nacional`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BusinessWithCategory[];
    },
  });
};

export const useFeaturedBusinesses = (categoryId?: string) => {
  return useQuery({
    queryKey: ["businesses", "featured", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            icon
          )
        `)
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("display_order", { ascending: true })
        .limit(6);
      
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BusinessWithCategory[];
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
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            icon
          )
        `)
        .eq("slug", slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as BusinessWithCategory | null;
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
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            icon
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BusinessWithCategory[];
    },
  });
};

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (business: Omit<Business, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("businesses")
        .insert(business)
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
        .update(updates)
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
