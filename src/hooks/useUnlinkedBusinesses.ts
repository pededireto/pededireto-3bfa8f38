import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnlinkedBusinesses(q = "") {
  return useQuery({
    queryKey: ["unlinked-businesses", q],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_unlinked_businesses" as any, { p_q: q, p_limit: 50 });
      if (error) throw error;
      return data as { id: string; name: string; city: string; slug: string; is_active: boolean }[];
    },
    placeholderData: (prev) => prev,
  });
}
