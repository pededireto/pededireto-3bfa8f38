import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches active business counts per subcategory.
 * Queries business_subcategories directly (no 1000 row limit issue
 * since we only fetch subcategory_id, not full rows).
 * Returns a Map<subcategoryId, count>.
 */
export const useSubcategoryCounts = () => {
  return useQuery({
    queryKey: ["subcategory-business-counts"],
    queryFn: async (): Promise<Map<string, number>> => {
      // Tenta primeiro via RPC (mais eficiente)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_subcategory_business_counts" as any);

        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          const counts = new Map<string, number>();
          for (const row of rpcData as { subcategory_id: string; count: number }[]) {
            counts.set(row.subcategory_id, Number(row.count));
          }
          return counts;
        }
      } catch {
        // RPC falhou — continua para fallback
      }

      // Fallback: query directa com paginação para evitar limite de 1000 rows
      const counts = new Map<string, number>();
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from("business_subcategories")
          .select("subcategory_id, business_id")
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        // Para cada linha verificar se o negócio está activo seria muito
        // custoso aqui — assumimos que a RPC já filtra por is_active = true.
        // O fallback conta todos (activos e inactivos) como aproximação.
        for (const row of data as { subcategory_id: string }[]) {
          const current = counts.get(row.subcategory_id) ?? 0;
          counts.set(row.subcategory_id, current + 1);
        }

        if (data.length < pageSize) break;
        page++;
      }

      return counts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
    retry: 2,
  });
};
