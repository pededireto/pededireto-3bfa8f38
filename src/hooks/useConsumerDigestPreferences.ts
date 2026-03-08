import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useConsumerDigestPreferences = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["consumer-digest-prefs", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("consumer_email_preferences")
        .select("weekly_digest")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      // Default is true (opted in)
      return { weekly_digest: data?.weekly_digest ?? true };
    },
    enabled: !!user?.id,
  });

  return query;
};

export const useToggleConsumerDigest = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await (supabase as any)
        .from("consumer_email_preferences")
        .upsert(
          { user_id: user!.id, weekly_digest: enabled, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consumer-digest-prefs"] });
    },
  });
};
