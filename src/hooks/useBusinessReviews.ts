import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessReview {
  id: string;
  business_id: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified: boolean;
  verification_method: string | null;
  helpful_count: number;
  not_helpful_count: number;
  business_response: string | null;
  business_response_at: string | null;
  is_featured: boolean;
  is_flagged: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  photos: string[];
  created_at: string;
  updated_at: string;
  reviewer_full_name?: string | null;
}

export interface ReviewStats {
  business_id: string;
  total_reviews: number;
  verified_reviews_count: number;
  average_rating: number;
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
  rating_5_percent: number;
  rating_4_percent: number;
  rating_3_percent: number;
  rating_2_percent: number;
  rating_1_percent: number;
  last_review_at: string | null;
  first_review_at: string | null;
}

export interface ReviewHelpfulnessVote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

export interface CreateReviewInput {
  business_id: string;
  rating: number;
  title?: string;
  comment?: string;
  photos?: string[];
}

export interface UpdateReviewInput {
  id: string;
  rating?: number;
  title?: string;
  comment?: string;
  photos?: string[];
}

export interface VoteHelpfulInput {
  review_id: string;
  is_helpful: boolean;
}

export interface RespondToReviewInput {
  review_id: string;
  response: string;
}

// ============================================================================
// QUERIES
// ============================================================================

export const useBusinessReviews = (
  businessId: string | undefined,
  filters?: {
    verified?: boolean;
    minRating?: number;
    orderBy?: "recent" | "rating_high" | "rating_low" | "helpful";
  },
) => {
  return useQuery({
    queryKey: ["business-reviews", businessId, filters],
    queryFn: async () => {
      if (!businessId) return [];

      // ── CORRIGIDO: buscar reviews sem join, depois buscar nomes separadamente ──
      let query = (supabase as any)
        .from("business_reviews")
        .select("*")
        .eq("business_id", businessId)
        .eq("moderation_status", "approved");

      if (filters?.verified) {
        query = query.eq("is_verified", true);
      }
      if (filters?.minRating) {
        query = query.gte("rating", filters.minRating);
      }

      switch (filters?.orderBy) {
        case "rating_high":
          query = query.order("rating", { ascending: false });
          break;
        case "rating_low":
          query = query.order("rating", { ascending: true });
          break;
        case "helpful":
          query = query.order("helpful_count", { ascending: false });
          break;
        case "recent":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as BusinessReview[];

      // ── Buscar nomes dos reviewers via profiles.user_id ──
      const userIds = [...new Set((data as any[]).map((r) => r.user_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        if (profiles) {
          profileMap = Object.fromEntries((profiles as any[]).map((p) => [p.user_id, p.full_name]));
        }
      }

      return (data as any[]).map((r) => ({
        ...r,
        reviewer_full_name: profileMap[r.user_id] || null,
      })) as BusinessReview[];
    },
    enabled: !!businessId,
  });
};

export const useBusinessReviewStats = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["business-review-stats", businessId],
    queryFn: async () => {
      if (!businessId) return null;

      const { data, error } = await (supabase as any)
        .from("business_review_stats")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();

      if (error) throw error;
      return data as ReviewStats | null;
    },
    enabled: !!businessId,
  });
};

export const useUserReviewForBusiness = (businessId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-review", businessId, user?.id],
    queryFn: async () => {
      if (!businessId || !user?.id) return null;

      const { data, error } = await (supabase as any)
        .from("business_reviews")
        .select("*")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BusinessReview | null;
    },
    enabled: !!businessId && !!user?.id,
  });
};

export const useUserVoteForReview = (reviewId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-vote", reviewId, user?.id],
    queryFn: async () => {
      if (!reviewId || !user?.id) return null;

      const { data, error } = await (supabase as any)
        .from("review_helpfulness_votes")
        .select("*")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ReviewHelpfulnessVote | null;
    },
    enabled: !!reviewId && !!user?.id,
  });
};

// ============================================================================
// ALL REVIEWS (for admin/moderation)
// ============================================================================

export const useAllReviews = (filters?: { status?: string; minRating?: number; search?: string }) => {
  return useQuery({
    queryKey: ["all-reviews", filters],
    queryFn: async () => {
      let query = (supabase as any).from("business_reviews").select("*").order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("moderation_status", filters.status);
      }
      if (filters?.minRating) {
        query = query.gte("rating", filters.minRating);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BusinessReview[];
    },
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("business_reviews")
        .insert({
          business_id: input.business_id,
          user_id: user.id,
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || null,
          photos: input.photos || [],
          moderation_status: input.rating >= 3 ? "approved" : "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as BusinessReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["business-review-stats", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["user-review", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateReviewInput) => {
      const { data, error } = await (supabase as any)
        .from("business_reviews")
        .update({
          rating: updates.rating,
          title: updates.title,
          comment: updates.comment,
          photos: updates.photos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BusinessReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["business-review-stats", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["user-review", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data: review } = await (supabase as any)
        .from("business_reviews")
        .select("business_id")
        .eq("id", reviewId)
        .single();

      const { error } = await (supabase as any).from("business_reviews").delete().eq("id", reviewId);

      if (error) throw error;
      return review?.business_id as string | undefined;
    },
    onSuccess: (businessId) => {
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ["business-reviews", businessId] });
        queryClient.invalidateQueries({ queryKey: ["business-review-stats", businessId] });
        queryClient.invalidateQueries({ queryKey: ["user-review", businessId] });
      }
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
  });
};

export const useVoteReviewHelpfulness = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: VoteHelpfulInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("review_helpfulness_votes")
        .upsert(
          {
            review_id: input.review_id,
            user_id: user.id,
            is_helpful: input.is_helpful,
          },
          { onConflict: "review_id,user_id" },
        )
        .select()
        .single();

      if (error) throw error;
      return data as ReviewHelpfulnessVote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-vote", data.review_id] });
    },
  });
};

export const useRemoveVote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await (supabase as any)
        .from("review_helpfulness_votes")
        .delete()
        .eq("review_id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;
      return reviewId;
    },
    onSuccess: (reviewId) => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-vote", reviewId] });
    },
  });
};

export const useRespondToReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: RespondToReviewInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("business_reviews")
        .update({
          business_response: input.response,
          business_response_at: new Date().toISOString(),
          business_response_user_id: user.id,
        })
        .eq("id", input.review_id)
        .select()
        .single();

      if (error) throw error;
      return data as BusinessReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
  });
};

export const useFlagReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      const { data, error } = await (supabase as any)
        .from("business_reviews")
        .update({
          is_flagged: true,
          flag_reason: reason,
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return data as BusinessReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
  });
};

export const useModerateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: "approved" | "rejected" }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("business_reviews")
        .update({
          moderation_status: status,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return data as BusinessReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews", data.business_id] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
  });
};
