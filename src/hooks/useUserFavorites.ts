import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*, businesses(id, name, slug, logo_url, category_id, categories(name))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useIsFavorited = (businessId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-favorited", user?.id, businessId],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!businessId,
  });
};

export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, isFavorited }: { businessId: string; isFavorited: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isFavorited) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("business_id", businessId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, business_id: businessId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      queryClient.invalidateQueries({ queryKey: ["is-favorited", user?.id, businessId] });
      queryClient.invalidateQueries({ queryKey: ["favorites-count", businessId] });
    },
  });
};

export const useFavoritesCount = (businessId: string) => {
  return useQuery({
    queryKey: ["favorites-count", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_favorites_count", {
        business_uuid: businessId,
      });
      if (error) throw error;
      return data ?? 0;
    },
    enabled: !!businessId,
  });
};
