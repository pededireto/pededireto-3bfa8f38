import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommercialBenchmarkData {
  ticket_medio?: string;
  frequencia_cliente?: string;
  canal_aquisicao_principal?: string;
  factor_decisao_1?: string;
  tendencia_2025?: string;
  diferencial_competitivo?: string;
  presenca_digital?: {
    website?: string;
    redes_sociais?: string;
  };
  keywords_google?: string[];
  benchmark_avaliacoes?: string;
  dica_ouro?: string;
}

export const useCommercialBenchmark = (
  category: string | null | undefined,
  subcategory: string | null | undefined
) => {
  return useQuery({
    queryKey: ["commercial-benchmark", category, subcategory],
    queryFn: async (): Promise<CommercialBenchmarkData | null> => {
      if (!category || !subcategory) return null;

      const { data, error } = await supabase
        .from("benchmarking_cache")
        .select("data")
        .eq("category", category)
        .eq("subcategory", subcategory)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return (data.data as unknown as CommercialBenchmarkData) || null;
    },
    enabled: !!(category && subcategory),
    staleTime: 30 * 60 * 1000, // 30 min cache
  });
};
