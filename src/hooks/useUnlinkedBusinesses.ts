// src/hooks/useUnlinkedBusinesses.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnlinkedBusinesses(q = "") {
  return useQuery(["unlinked-businesses", q], async () => {
    const { data, error } = await supabase.rpc("get_unlinked_businesses", { p_q: q, p_limit: 50 });
    if (error) throw error;
    return data;
  }, { keepPreviousData: true });
}
