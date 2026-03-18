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
  website: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
}

export const useBusinessBenchmarkSector = (businessId: string | null | undefined) => {
  const { data: bizInfo } = useQuery({
    queryKey: ["biz-sector-info", businessId],
    queryFn: async () => {
      console.log("[SectorBenchmark] Fetching biz info for:", businessId);

      const { data, error } = await (supabase as any)
        .from("businesses")
        .select("category_id, subcategory_id, cta_website, cta_whatsapp, instagram_url, facebook_url")
        .eq("id", businessId!)
        .single();

      if (error) {
        console.error("[SectorBenchmark] Error fetching business:", error);
        throw error;
      }

      console.log("[SectorBenchmark] Business raw data:", data);
      console.log("[SectorBenchmark] category_id:", data?.category_id);
      console.log("[SectorBenchmark] subcategory_id:", data?.subcategory_id);

      let categoryName = "";
      let subcategoryName = "";

      if (data.category_id) {
        const { data: cat, error: catErr } = await supabase
          .from("categories")
          .select("name")
          .eq("id", data.category_id)
          .single();

        if (catErr) console.error("[SectorBenchmark] Error fetching category:", catErr);
        categoryName = cat?.name || "";
        console.log("[SectorBenchmark] categoryName:", categoryName);
      } else {
        console.warn("[SectorBenchmark] category_id is null/empty!");
      }

      if (data.subcategory_id) {
        const { data: sub, error: subErr } = await supabase
          .from("subcategories")
          .select("name")
          .eq("id", data.subcategory_id)
          .single();

        if (subErr) console.error("[SectorBenchmark] Error fetching subcategory:", subErr);
        subcategoryName = sub?.name || "";
        console.log("[SectorBenchmark] subcategoryName:", subcategoryName);
      } else {
        console.warn("[SectorBenchmark] subcategory_id is null/empty!");
      }

      return {
        category: categoryName,
        subcategory: subcategoryName,
        profile: {
          website: data.cta_website,
          whatsapp: data.cta_whatsapp,
          instagram: data.instagram_url,
          facebook: data.facebook_url,
        } as BusinessProfile,
      };
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["sector-benchmark", bizInfo?.category, bizInfo?.subcategory],
    queryFn: async () => {
      console.log("[SectorBenchmark] Invoking Edge Function with:", {
        category: bizInfo!.category,
        subcategory: bizInfo!.subcategory,
        business_id: businessId,
      });

      const { data: res, error: fnErr } = await supabase.functions.invoke("get-benchmarking", {
        body: {
          category: bizInfo!.category,
          subcategory: bizInfo!.subcategory,
          business_id: businessId,
        },
      });

      console.log("[SectorBenchmark] Edge Function response:", res);
      console.log("[SectorBenchmark] Edge Function error:", fnErr);

      if (fnErr) throw fnErr;
      if (res?.error) throw new Error(res.error);

      return res.data as SectorBenchmarkData;
    },
    enabled: !!bizInfo?.category && !!bizInfo?.subcategory,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  console.log(
    "[SectorBenchmark] Hook state — bizInfo:",
    bizInfo,
    "| data:",
    data,
    "| isLoading:",
    isLoading,
    "| error:",
    error,
  );

  return {
    data,
    isLoading: isLoading || !bizInfo,
    error,
    profile: bizInfo?.profile,
    category: bizInfo?.category,
    subcategory: bizInfo?.subcategory,
  };
};
