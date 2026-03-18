import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SectorBenchmarkData {
  ticket_medio: string;
  frequencia_cliente: string;
  canal_aquisicao_principal: string;
  factor_decisao_1: string;
  tendencia_2025: string;
  diferencial_competitivo: string;
  presenca_digital: {
    website: string;
    redes_sociais: string;
  };
  keywords_google: string[];
  benchmark_avaliacoes: string;
  dica_ouro: string;
}

interface BusinessProfile {
  website?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
}

export const useBusinessBenchmarkSector = (
  businessId: string | null | undefined
) => {
  // First get category/subcategory names for this business
  const { data: bizInfo } = useQuery({
    queryKey: ["biz-sector-info", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("category_id, subcategory_id, website, whatsapp, instagram, facebook, tiktok")
        .eq("id", businessId!)
        .single();
      if (error) throw error;

      let categoryName = "";
      let subcategoryName = "";

      if (data.category_id) {
        const { data: cat } = await supabase
          .from("categories")
          .select("name")
          .eq("id", data.category_id)
          .single();
        categoryName = cat?.name || "";
      }

      if (data.subcategory_id) {
        const { data: sub } = await supabase
          .from("subcategories")
          .select("name")
          .eq("id", data.subcategory_id)
          .single();
        subcategoryName = sub?.name || "";
      }

      return {
        category: categoryName,
        subcategory: subcategoryName,
        profile: {
          website: data.website,
          whatsapp: data.whatsapp,
          instagram: data.instagram,
          facebook: data.facebook,
          tiktok: data.tiktok,
        } as BusinessProfile,
      };
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["sector-benchmark", bizInfo?.category, bizInfo?.subcategory],
    queryFn: async () => {
      const { data: res, error: fnErr } = await supabase.functions.invoke(
        "get-benchmarking",
        {
          body: {
            category: bizInfo!.category,
            subcategory: bizInfo!.subcategory,
            business_id: businessId,
          },
        }
      );

      if (fnErr) throw fnErr;
      if (res?.error) throw new Error(res.error);

      return res.data as SectorBenchmarkData;
    },
    enabled: !!bizInfo?.category && !!bizInfo?.subcategory,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return {
    data,
    isLoading: isLoading || !bizInfo,
    error,
    profile: bizInfo?.profile,
    category: bizInfo?.category,
    subcategory: bizInfo?.subcategory,
  };
};
