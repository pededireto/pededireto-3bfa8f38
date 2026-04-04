import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// ── helpers ──
const generateSlug = (title: string, city: string, id: string) => {
  const base = `${title} ${city}`
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${id.slice(0, 6)}`;
};

export interface JobOffer {
  id: string;
  business_id: string;
  title: string;
  description: string;
  city: string;
  type: string;
  salary_range: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  expires_at: string;
  slug: string | null;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
  businesses?: { id: string; name: string; slug: string | null; logo_url: string | null };
}

export interface JobFilters {
  search?: string;
  city?: string;
  type?: string;
  sort?: "recent" | "popular";
  page?: number;
}

const PAGE_SIZE = 20;

// ── Public listing ──
export const usePublicJobOffers = (filters: JobFilters = {}) => {
  return useQuery({
    queryKey: ["public-job-offers", filters],
    queryFn: async () => {
      let q = supabase
        .from("job_offers")
        .select("*, businesses(id, name, slug, logo_url)", { count: "exact" })
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString());

      if (filters.city) q = q.ilike("city", `%${filters.city}%`);
      if (filters.type) q = q.eq("type", filters.type);
      if (filters.search) q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

      if (filters.sort === "popular") {
        q = q.order("views_count", { ascending: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }

      const page = filters.page || 0;
      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { offers: (data || []) as JobOffer[], total: count || 0 };
    },
  });
};

// ── Detail by slug ──
export const useJobOfferDetail = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["job-offer-detail", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("job_offers")
        .select("*, businesses(id, name, slug, logo_url)")
        .eq("slug", slug)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (error) throw error;

      // Increment views
      if (data) {
        await supabase
          .from("job_offers")
          .update({ views_count: (data.views_count || 0) + 1 } as any)
          .eq("id", data.id);
      }

      return data as JobOffer | null;
    },
    enabled: !!slug,
  });
};

// ── Business offers (owner) ──
export const useBusinessJobOffers = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-job-offers", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobOffer[];
    },
    enabled: !!businessId,
  });
};

// ── Create ──
export const useCreateJobOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      business_id: string;
      title: string;
      description: string;
      city: string;
      type: string;
      salary_range?: string;
      contact_email?: string;
      contact_phone?: string;
    }) => {
      // Check max 3 active
      const { count } = await supabase
        .from("job_offers")
        .select("id", { count: "exact", head: true })
        .eq("business_id", input.business_id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString());

      if ((count || 0) >= 3) throw new Error("Máximo de 3 ofertas activas atingido.");

      const tempId = crypto.randomUUID();
      const slug = generateSlug(input.title, input.city, tempId);

      const { data, error } = await supabase
        .from("job_offers")
        .insert({ ...input, slug, id: tempId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success("Oferta criada com sucesso!");
      qc.invalidateQueries({ queryKey: ["business-job-offers", vars.business_id] });
      qc.invalidateQueries({ queryKey: ["public-job-offers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// ── Update ──
export const useUpdateJobOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobOffer> & { id: string }) => {
      const { error } = await supabase.from("job_offers").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oferta actualizada.");
      qc.invalidateQueries({ queryKey: ["business-job-offers"] });
      qc.invalidateQueries({ queryKey: ["public-job-offers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// ── Delete ──
export const useDeleteJobOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oferta removida.");
      qc.invalidateQueries({ queryKey: ["business-job-offers"] });
      qc.invalidateQueries({ queryKey: ["public-job-offers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// ── Republish ──
export const useRepublishJobOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 15);
      const { error } = await supabase
        .from("job_offers")
        .update({ expires_at: newExpiry.toISOString(), is_active: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oferta republicada por mais 15 dias.");
      qc.invalidateQueries({ queryKey: ["business-job-offers"] });
      qc.invalidateQueries({ queryKey: ["public-job-offers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// ── Apply ──
export const useApplyToJob = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobOfferId: string) => {
      if (!user) throw new Error("Autenticação necessária");
      const { error } = await supabase
        .from("job_applications")
        .insert({ job_offer_id: jobOfferId, user_id: user.id } as any);
      if (error) {
        if (error.code === "23505") throw new Error("Já se candidatou a esta oferta.");
        throw error;
      }
      // Increment count
      const { data: offer } = await supabase.from("job_offers").select("applications_count").eq("id", jobOfferId).single();
      if (offer) {
        await supabase.from("job_offers").update({ applications_count: (offer.applications_count || 0) + 1 } as any).eq("id", jobOfferId);
      }
    },
    onSuccess: () => {
      toast.success("Candidatura registada!");
      qc.invalidateQueries({ queryKey: ["user-job-data"] });
      qc.invalidateQueries({ queryKey: ["public-job-offers"] });
      qc.invalidateQueries({ queryKey: ["job-offer-detail"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// ── Favorite toggle ──
export const useFavoriteJob = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobOfferId, isFavorited }: { jobOfferId: string; isFavorited: boolean }) => {
      if (!user) throw new Error("Autenticação necessária");
      if (isFavorited) {
        await supabase.from("job_favorites").delete().eq("job_offer_id", jobOfferId).eq("user_id", user.id);
      } else {
        const { error } = await supabase.from("job_favorites").insert({ job_offer_id: jobOfferId, user_id: user.id } as any);
        if (error && error.code !== "23505") throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-job-data"] });
    },
  });
};

// ── User job data (applications + favorites) ──
export const useUserJobData = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-job-data", user?.id],
    queryFn: async () => {
      if (!user) return { applications: [], favorites: [] };

      const [appsRes, favsRes] = await Promise.all([
        supabase
          .from("job_applications")
          .select("*, job_offers(*, businesses(id, name, slug, logo_url))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("job_favorites")
          .select("*, job_offers(*, businesses(id, name, slug, logo_url))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      return {
        applications: appsRes.data || [],
        favorites: favsRes.data || [],
      };
    },
    enabled: !!user,
  });
};

// ── Admin listing (all offers, no expiry filter) ──
export const useAdminJobOffers = (filters: { city?: string; status?: string } = {}) => {
  return useQuery({
    queryKey: ["admin-job-offers", filters],
    queryFn: async () => {
      let q = supabase
        .from("job_offers")
        .select("*, businesses(id, name, slug, logo_url)", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filters.city) q = q.ilike("city", `%${filters.city}%`);
      if (filters.status === "active") q = q.eq("is_active", true).gt("expires_at", new Date().toISOString());
      if (filters.status === "expired") q = q.lt("expires_at", new Date().toISOString());
      if (filters.status === "inactive") q = q.eq("is_active", false);

      const { data, error, count } = await q;
      if (error) throw error;
      return { offers: (data || []) as JobOffer[], total: count || 0 };
    },
  });
};
